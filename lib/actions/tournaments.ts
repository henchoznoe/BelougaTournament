/**
 * File: lib/actions/tournaments.ts
 * Description: Server actions for tournament CRUD operations (ADMIN + SUPERADMIN).
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

'use server'

import { revalidateTag } from 'next/cache'
import { authenticatedAction } from '@/lib/actions/safe-action'
import prisma from '@/lib/core/prisma'
import type { ActionState } from '@/lib/types/actions'
import {
  deleteTournamentSchema,
  tournamentSchema,
  updateTournamentSchema,
  updateTournamentStatusSchema,
} from '@/lib/validations/tournaments'
import { Role } from '@/prisma/generated/prisma/enums'

/** Converts empty strings to null for nullable Prisma fields. */
const toNullable = (val: string | undefined): string | null => val || null

/**
 * Checks whether an ADMIN user is assigned to a given tournament.
 * SUPERADMINs always pass this check.
 */
const checkAdminAssignment = async (
  userId: string,
  userRole: string,
  tournamentId: string,
): Promise<boolean> => {
  if (userRole === Role.SUPERADMIN) return true

  const assignment = await prisma.adminAssignment.findUnique({
    where: {
      adminId_tournamentId: {
        adminId: userId,
        tournamentId,
      },
    },
  })
  return !!assignment
}

/** Creates a new tournament with its dynamic fields. */
export const createTournament = authenticatedAction({
  schema: tournamentSchema,
  role: [Role.ADMIN, Role.SUPERADMIN],
  handler: async (data): Promise<ActionState> => {
    await prisma.tournament.create({
      data: {
        title: data.title,
        slug: data.slug,
        description: data.description,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        registrationOpen: new Date(data.registrationOpen),
        registrationClose: new Date(data.registrationClose),
        maxTeams: data.maxTeams,
        format: data.format,
        teamSize: data.teamSize,
        game: toNullable(data.game),
        imageUrl: toNullable(data.imageUrl),
        rules: toNullable(data.rules),
        prize: toNullable(data.prize),
        toornamentId: toNullable(data.toornamentId),
        streamUrl: toNullable(data.streamUrl),
        autoApprove: data.autoApprove,
        fields: {
          create: data.fields.map(field => ({
            label: field.label,
            type: field.type,
            required: field.required,
            order: field.order,
          })),
        },
      },
    })

    revalidateTag('tournaments', 'hours')
    revalidateTag('tournament-options', 'minutes')
    revalidateTag('dashboard-stats', 'minutes')

    return { success: true, message: 'Le tournoi a été créé.' }
  },
})

/** Updates an existing tournament and syncs its dynamic fields. */
export const updateTournament = authenticatedAction({
  schema: updateTournamentSchema,
  role: [Role.ADMIN, Role.SUPERADMIN],
  handler: async (data, session): Promise<ActionState> => {
    const hasAccess = await checkAdminAssignment(
      session.user.id as string,
      session.user.role as string,
      data.id,
    )
    if (!hasAccess) {
      return {
        success: false,
        message: "Vous n'avez pas accès à ce tournoi.",
      }
    }

    await prisma.$transaction([
      // Delete existing fields and re-create them
      prisma.tournamentField.deleteMany({
        where: { tournamentId: data.id },
      }),
      prisma.tournament.update({
        where: { id: data.id },
        data: {
          title: data.title,
          slug: data.slug,
          description: data.description,
          startDate: new Date(data.startDate),
          endDate: new Date(data.endDate),
          registrationOpen: new Date(data.registrationOpen),
          registrationClose: new Date(data.registrationClose),
          maxTeams: data.maxTeams,
          format: data.format,
          teamSize: data.teamSize,
          game: toNullable(data.game),
          imageUrl: toNullable(data.imageUrl),
          rules: toNullable(data.rules),
          prize: toNullable(data.prize),
          toornamentId: toNullable(data.toornamentId),
          streamUrl: toNullable(data.streamUrl),
          autoApprove: data.autoApprove,
          fields: {
            create: data.fields.map(field => ({
              label: field.label,
              type: field.type,
              required: field.required,
              order: field.order,
            })),
          },
        },
      }),
    ])

    revalidateTag('tournaments', 'hours')
    revalidateTag('tournament-options', 'minutes')
    revalidateTag('dashboard-upcoming', 'minutes')

    return { success: true, message: 'Le tournoi a été mis à jour.' }
  },
})

/** Deletes a tournament by ID. */
export const deleteTournament = authenticatedAction({
  schema: deleteTournamentSchema,
  role: [Role.ADMIN, Role.SUPERADMIN],
  handler: async (data, session): Promise<ActionState> => {
    const hasAccess = await checkAdminAssignment(
      session.user.id as string,
      session.user.role as string,
      data.id,
    )
    if (!hasAccess) {
      return {
        success: false,
        message: "Vous n'avez pas accès à ce tournoi.",
      }
    }

    await prisma.tournament.delete({
      where: { id: data.id },
    })

    revalidateTag('tournaments', 'hours')
    revalidateTag('tournament-options', 'minutes')
    revalidateTag('dashboard-stats', 'minutes')
    revalidateTag('dashboard-upcoming', 'minutes')
    revalidateTag('dashboard-registrations', 'minutes')

    return { success: true, message: 'Le tournoi a été supprimé.' }
  },
})

/** Updates a tournament's status (DRAFT / PUBLISHED / ARCHIVED). */
export const updateTournamentStatus = authenticatedAction({
  schema: updateTournamentStatusSchema,
  role: [Role.ADMIN, Role.SUPERADMIN],
  handler: async (data, session): Promise<ActionState> => {
    const hasAccess = await checkAdminAssignment(
      session.user.id as string,
      session.user.role as string,
      data.id,
    )
    if (!hasAccess) {
      return {
        success: false,
        message: "Vous n'avez pas accès à ce tournoi.",
      }
    }

    await prisma.tournament.update({
      where: { id: data.id },
      data: { status: data.status },
    })

    revalidateTag('tournaments', 'hours')
    revalidateTag('tournament-options', 'minutes')
    revalidateTag('dashboard-stats', 'minutes')
    revalidateTag('dashboard-upcoming', 'minutes')

    return { success: true, message: 'Le statut du tournoi a été mis à jour.' }
  },
})
