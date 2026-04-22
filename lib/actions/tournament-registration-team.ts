/**
 * File: lib/actions/tournament-registration-team.ts
 * Description: Server actions for team-based tournament registration:
 *   create a team and register as captain, or join an existing team.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

'use server'

import { updateTag } from 'next/cache'
import { authenticatedAction } from '@/lib/actions/safe-action'
import {
  fetchTournamentForRegistration,
  startPaidRegistrationCheckout,
  type TeamWithMemberCount,
  upsertRegistrationAttempt,
} from '@/lib/actions/tournament-registration-helpers'
import { CACHE_TAGS } from '@/lib/config/constants'
import prisma from '@/lib/core/prisma'
import type { ActionState } from '@/lib/types/actions'
import { removeUserFromTeam, syncTeamFullState } from '@/lib/utils/team'
import { validateFieldValues } from '@/lib/utils/tournament-helpers'
import { createTeamSchema, joinTeamSchema } from '@/lib/validations/tournaments'
import {
  RegistrationType,
  TournamentFormat,
} from '@/prisma/generated/prisma/enums'

/** Creates a team and registers the current user as captain. */
export const createTeamAndRegister = authenticatedAction({
  schema: createTeamSchema,
  handler: async (
    data,
    session,
  ): Promise<ActionState<{ checkoutUrl: string }>> => {
    const result = await fetchTournamentForRegistration(
      session.user.id,
      data.tournamentId,
    )
    if ('error' in result)
      return result.error as ActionState<{ checkoutUrl: string }>
    const { tournament, existingRegistration } = result

    if (tournament.format !== TournamentFormat.TEAM) {
      return {
        success: false,
        message: 'Ce tournoi est en format solo. Utilisez le formulaire solo.',
      }
    }

    const validation = validateFieldValues(tournament.fields, data.fieldValues)
    if (!validation.valid) {
      return { success: false, message: validation.message }
    }

    let registration: Awaited<ReturnType<typeof upsertRegistrationAttempt>>
    try {
      registration = await prisma.$transaction(async tx => {
        if (tournament.maxTeams !== null) {
          const teamCount = await tx.team.count({
            where: { tournamentId: data.tournamentId },
          })
          if (teamCount >= tournament.maxTeams) {
            throw new Error('MAX_TEAMS_REACHED')
          }
        }

        await removeUserFromTeam(tx, session.user.id, data.tournamentId)

        const team = await tx.team.create({
          data: {
            name: data.teamName,
            captainId: session.user.id,
            tournamentId: data.tournamentId,
            isFull: false,
          },
        })

        await tx.teamMember.create({
          data: { teamId: team.id, userId: session.user.id },
        })

        const reg = await upsertRegistrationAttempt({
          tx,
          existingRegistration,
          tournament,
          userId: session.user.id,
          fieldValues: data.fieldValues,
          teamId: team.id,
        })

        await syncTeamFullState(tx, team.id, tournament.teamSize)

        return reg
      })
    } catch (error) {
      if (error instanceof Error && error.message === 'MAX_TEAMS_REACHED') {
        return {
          success: false,
          message: "Le nombre maximum d'équipes est atteint.",
        }
      }
      throw error
    }

    if (tournament.registrationType === RegistrationType.PAID) {
      return startPaidRegistrationCheckout({
        registrationId: registration.id,
        tournament,
        userId: session.user.id,
        returnPath: data.returnPath,
      })
    }

    updateTag(CACHE_TAGS.TOURNAMENTS)
    updateTag(CACHE_TAGS.DASHBOARD_REGISTRATIONS)
    updateTag(CACHE_TAGS.DASHBOARD_STATS)

    return {
      success: true,
      message: 'Votre équipe a été créée et votre inscription enregistrée.',
    }
  },
})

/** Joins an existing team and registers the current user. */
export const joinTeamAndRegister = authenticatedAction({
  schema: joinTeamSchema,
  handler: async (
    data,
    session,
  ): Promise<ActionState<{ checkoutUrl: string }>> => {
    const result = await fetchTournamentForRegistration(
      session.user.id,
      data.tournamentId,
    )
    if ('error' in result)
      return result.error as ActionState<{ checkoutUrl: string }>
    const { tournament, existingRegistration } = result

    if (tournament.format !== TournamentFormat.TEAM) {
      return {
        success: false,
        message: 'Ce tournoi est en format solo. Utilisez le formulaire solo.',
      }
    }

    const team = (await prisma.team.findUnique({
      where: { id: data.teamId },
      include: { _count: { select: { members: true } } },
    })) as TeamWithMemberCount | null

    if (!team || team.tournamentId !== data.tournamentId) {
      return { success: false, message: 'Équipe introuvable.' }
    }

    const validation = validateFieldValues(tournament.fields, data.fieldValues)
    if (!validation.valid) {
      return { success: false, message: validation.message }
    }

    let registration: Awaited<ReturnType<typeof upsertRegistrationAttempt>>
    try {
      registration = await prisma.$transaction(async tx => {
        const freshTeam = await tx.team.findUnique({
          where: { id: data.teamId },
          include: { _count: { select: { members: true } } },
        })
        if (!freshTeam || freshTeam._count.members >= tournament.teamSize) {
          throw new Error('TEAM_FULL')
        }

        await removeUserFromTeam(tx, session.user.id, data.tournamentId)

        await tx.teamMember.create({
          data: { teamId: data.teamId, userId: session.user.id },
        })

        const reg = await upsertRegistrationAttempt({
          tx,
          existingRegistration,
          tournament,
          userId: session.user.id,
          fieldValues: data.fieldValues,
          teamId: data.teamId,
        })

        await syncTeamFullState(tx, data.teamId, tournament.teamSize)

        return reg
      })
    } catch (error) {
      if (error instanceof Error && error.message === 'TEAM_FULL') {
        return { success: false, message: 'Cette équipe est complète.' }
      }
      throw error
    }

    if (tournament.registrationType === RegistrationType.PAID) {
      return startPaidRegistrationCheckout({
        registrationId: registration.id,
        tournament,
        userId: session.user.id,
        returnPath: data.returnPath,
      })
    }

    updateTag(CACHE_TAGS.TOURNAMENTS)
    updateTag(CACHE_TAGS.DASHBOARD_REGISTRATIONS)
    updateTag(CACHE_TAGS.DASHBOARD_STATS)

    return {
      success: true,
      message:
        "Vous avez rejoint l'équipe et votre inscription a été enregistrée.",
    }
  },
})
