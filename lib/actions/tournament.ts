/**
 * File: lib/actions/tournament.ts
 * Description: Server actions for managing tournaments.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

'use server'

import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { authenticatedAction } from '@/lib/actions/safe-action'
import { APP_ROUTES } from '@/lib/config/routes'
import auth from '@/lib/core/auth'
import prisma from '@/lib/core/prisma'
import * as TournamentService from '@/lib/services/tournament.service'
import { getErrorMessage } from '@/lib/utils/errors'
import {
  deleteTournamentSchema,
  exportTournamentSchema,
  toggleVisibilitySchema,
  tournamentSchema,
  updateTournamentSchema,
} from '@/lib/validations/tournament'
import { Role } from '@/prisma/generated/prisma/client'

export const createTournament = authenticatedAction({
  schema: tournamentSchema,
  role: [Role.ADMIN, Role.SUPERADMIN],
  handler: async data => {
    try {
      await TournamentService.createTournament(data)
    } catch (error) {
      return {
        success: false,
        message: getErrorMessage(
          error,
          'Une erreur est survenue lors de la création du tournoi',
        ),
      }
    }

    revalidatePath(APP_ROUTES.ADMIN_TOURNAMENTS)
    redirect(APP_ROUTES.ADMIN_TOURNAMENTS)
  },
})

export const deleteTournament = authenticatedAction({
  schema: deleteTournamentSchema,
  role: [Role.ADMIN, Role.SUPERADMIN],
  handler: async ({ id }) => {
    try {
      await TournamentService.deleteTournament(id)
    } catch (error) {
      return {
        success: false,
        message: getErrorMessage(
          error,
          'Une erreur est survenue lors de la suppression du tournoi',
        ),
      }
    }

    revalidatePath(APP_ROUTES.ADMIN_TOURNAMENTS)
    return {
      success: true,
      message: 'Le tournoi a été supprimé avec succès',
    }
  },
})

export const updateTournament = authenticatedAction({
  schema: updateTournamentSchema,
  role: [Role.ADMIN, Role.SUPERADMIN],
  handler: async ({ id, data }) => {
    try {
      await TournamentService.updateTournament(id, data)
    } catch (error) {
      return {
        success: false,
        message: getErrorMessage(
          error,
          'Une erreur est survenue lors de la mise à jour du tournoi',
        ),
      }
    }

    revalidatePath(APP_ROUTES.ADMIN_TOURNAMENTS)
    revalidatePath(`${APP_ROUTES.ADMIN_TOURNAMENTS}/${id}`)
    redirect(`${APP_ROUTES.ADMIN_TOURNAMENTS}/${id}`)
  },
})

export const exportTournamentData = authenticatedAction({
  schema: exportTournamentSchema,
  role: [Role.ADMIN, Role.SUPERADMIN],
  handler: async tournamentId => {
    try {
      const flattenedData =
        await TournamentService.getTournamentExportData(tournamentId)

      if (!flattenedData) {
        return {
          success: false,
          message: "Le tournoi n'a pas été trouvé",
        }
      }

      return {
        success: true,
        data: JSON.stringify(flattenedData),
      }
    } catch (error) {
      console.error('Export Error:', error)
      return {
        success: false,
        message: "Une erreur est survenue lors de l'exportation du tournoi",
      }
    }
  },
})

export const toggleTournamentVisibility = authenticatedAction({
  schema: toggleVisibilitySchema,
  role: [Role.ADMIN, Role.SUPERADMIN],
  handler: async ({ id, visibility }) => {
    try {
      await TournamentService.toggleTournamentVisibility(id, visibility)
    } catch (error) {
      return {
        success: false,
        message: getErrorMessage(
          error,
          'Une erreur est survenue lors de la mise à jour du tournoi',
        ),
      }
    }

    revalidatePath(APP_ROUTES.ADMIN_TOURNAMENTS)
    revalidatePath(APP_ROUTES.ADMIN_TOURNAMENTS)
    revalidatePath(`${APP_ROUTES.ADMIN_TOURNAMENTS}/${id}`)
    revalidatePath(APP_ROUTES.TOURNAMENTS)

    return {
      success: true,
      message: 'Le tournoi a été mis à jour avec succès',
    }
  },
})

// Consolidated from tournament-manager.ts
const updateChallongeIdSchema = z.object({
  challongeId: z.string().trim().optional().or(z.literal('')),
})

export const updateChallongeId = async (
  tournamentId: string,
  _prevState: unknown,
  formData: FormData,
) => {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (
    !session?.user ||
    (session.user.role !== Role.ADMIN && session.user.role !== Role.SUPERADMIN)
  ) {
    return { success: false, message: 'Unauthorized' }
  }

  const rawData = {
    challongeId: formData.get('challongeId'),
  }

  const validation = updateChallongeIdSchema.safeParse(rawData)

  if (!validation.success) {
    return {
      success: false,
      message: 'Invalid input',
      errors: validation.error.flatten().fieldErrors,
    }
  }

  const challongeId = validation.data.challongeId || null

  try {
    await prisma.tournament.update({
      where: { id: tournamentId },
      data: { challongeId },
    })

    revalidatePath(`${APP_ROUTES.ADMIN_TOURNAMENTS}/${tournamentId}`)
    return { success: true, message: 'Challonge ID updated successfully.' }
  } catch (error) {
    console.error('Update Challonge ID Error:', error)
    return { success: false, message: 'Failed to update Challonge ID.' }
  }
}
