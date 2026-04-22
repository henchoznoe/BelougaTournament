/**
 * File: lib/actions/tournament-team.ts
 * Description: Server actions for admin team management and captain team rename.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

'use server'

import { updateTag } from 'next/cache'
import { cancelOrDeleteRegistration } from '@/lib/actions/registration-cancellation'
import { authenticatedAction } from '@/lib/actions/safe-action'
import { CACHE_TAGS } from '@/lib/config/constants'
import prisma from '@/lib/core/prisma'
import type { ActionState } from '@/lib/types/actions'
import type { TeamWithMembers } from '@/lib/types/team'
import { handleCaptainSuccession } from '@/lib/utils/team'
import {
  dissolveTeamSchema,
  kickPlayerSchema,
  updateTeamNameSchema,
} from '@/lib/validations/tournaments'
import { Role, TournamentStatus } from '@/prisma/generated/prisma/enums'

// ---------------------------------------------------------------------------
// Admin team management
// ---------------------------------------------------------------------------

/** Kicks a player from a team. If the player is captain, promotes the next member or dissolves the team. */
export const kickPlayer = authenticatedAction({
  schema: kickPlayerSchema,
  role: Role.ADMIN,
  handler: async (data): Promise<ActionState> => {
    // Fetch team with members ordered by join date
    const team = (await prisma.team.findUnique({
      where: { id: data.teamId },
      include: {
        tournament: { select: { teamSize: true } },
        members: { orderBy: { joinedAt: 'asc' } },
      },
    })) as TeamWithMembers | null

    if (!team || team.tournamentId !== data.tournamentId) {
      return { success: false, message: 'Équipe introuvable.' }
    }

    const isMember = team.members.some(m => m.userId === data.userId)
    if (!isMember) {
      return {
        success: false,
        message: "Ce joueur ne fait pas partie de l'équipe.",
      }
    }

    const registration = await prisma.tournamentRegistration.findUnique({
      where: {
        tournamentId_userId: {
          tournamentId: data.tournamentId,
          userId: data.userId,
        },
      },
      select: {
        id: true,
        paymentRequiredSnapshot: true,
        paymentStatus: true,
      },
    })

    await prisma.$transaction(async tx => {
      // 1. Remove team member record
      await tx.teamMember.deleteMany({
        where: { teamId: data.teamId, userId: data.userId },
      })

      // 2. Remove or cancel tournament registration
      if (registration?.paymentRequiredSnapshot) {
        await cancelOrDeleteRegistration({
          tx,
          registrationId: registration.id,
          paymentRequiredSnapshot: true,
          previousPaymentStatus: registration.paymentStatus,
          clearTeamId: true,
        })
      } else {
        await tx.tournamentRegistration.deleteMany({
          where: { tournamentId: data.tournamentId, userId: data.userId },
        })
      }

      // 3. Handle captain succession / team cleanup
      await handleCaptainSuccession(tx, team, data.userId)
    })

    updateTag(CACHE_TAGS.TOURNAMENTS)
    updateTag(CACHE_TAGS.DASHBOARD_REGISTRATIONS)
    updateTag(CACHE_TAGS.DASHBOARD_STATS)
    updateTag(CACHE_TAGS.DASHBOARD_PAYMENTS)

    return {
      success: true,
      message: "Le joueur a été retiré de l'équipe.",
    }
  },
})

/** Dissolves a team and removes all member registrations. */
export const dissolveTeam = authenticatedAction({
  schema: dissolveTeamSchema,
  role: Role.ADMIN,
  handler: async (data): Promise<ActionState> => {
    // Fetch team with members to get all user IDs
    const team = (await prisma.team.findUnique({
      where: { id: data.teamId },
      include: { members: true },
    })) as TeamWithMembers | null

    if (!team || team.tournamentId !== data.tournamentId) {
      return { success: false, message: 'Équipe introuvable.' }
    }

    const memberUserIds = team.members.map(m => m.userId)
    const registrations = await prisma.tournamentRegistration.findMany({
      where: {
        tournamentId: data.tournamentId,
        userId: { in: memberUserIds },
      },
      select: {
        id: true,
        userId: true,
        paymentRequiredSnapshot: true,
        paymentStatus: true,
      },
    })

    await prisma.$transaction(async tx => {
      // 1. Delete free registrations and cancel paid ones
      for (const registration of registrations) {
        if (registration.paymentRequiredSnapshot) {
          await cancelOrDeleteRegistration({
            tx,
            registrationId: registration.id,
            paymentRequiredSnapshot: true,
            previousPaymentStatus: registration.paymentStatus,
            clearTeamId: true,
          })
        } else {
          await tx.tournamentRegistration.delete({
            where: { id: registration.id },
          })
        }
      }

      // 2. Delete the team (cascades to TeamMember records)
      await tx.team.delete({ where: { id: data.teamId } })
    })

    updateTag(CACHE_TAGS.TOURNAMENTS)
    updateTag(CACHE_TAGS.DASHBOARD_REGISTRATIONS)
    updateTag(CACHE_TAGS.DASHBOARD_STATS)
    updateTag(CACHE_TAGS.DASHBOARD_PAYMENTS)

    return { success: true, message: "L'équipe a été dissoute." }
  },
})

// ---------------------------------------------------------------------------
// Player — update team name (captain only)
// ---------------------------------------------------------------------------

/** Allows the team captain to rename their team. */
export const updateTeamName = authenticatedAction({
  schema: updateTeamNameSchema,
  handler: async (data, session): Promise<ActionState> => {
    const userId = session.user.id

    const team = await prisma.team.findUnique({
      where: { id: data.teamId },
      select: { id: true, captainId: true, tournamentId: true },
    })

    if (!team) {
      return { success: false, message: 'Équipe introuvable.' }
    }

    if (team.captainId !== userId) {
      return {
        success: false,
        message: "Seul le capitaine peut renommer l'équipe.",
      }
    }

    // Ensure the tournament is still published
    const tournament = await prisma.tournament.findUnique({
      where: { id: team.tournamentId },
      select: { status: true },
    })

    if (!tournament || tournament.status !== TournamentStatus.PUBLISHED) {
      return {
        success: false,
        message: 'Ce tournoi ne permet plus de modifications.',
      }
    }

    // Check for duplicate team name within the same tournament
    const duplicate = await prisma.team.findFirst({
      where: {
        tournamentId: team.tournamentId,
        name: data.name,
        id: { not: team.id },
      },
      select: { id: true },
    })

    if (duplicate) {
      return {
        success: false,
        message: "Ce nom d'équipe est déjà pris dans ce tournoi.",
      }
    }

    await prisma.team.update({
      where: { id: team.id },
      data: { name: data.name },
    })

    updateTag(CACHE_TAGS.TOURNAMENTS)

    return { success: true, message: "Le nom de l'équipe a été mis à jour." }
  },
})
