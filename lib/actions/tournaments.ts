/**
 * File: lib/actions/tournaments.ts
 * Description: Server actions for creating, updating, and deleting tournaments.
 * Author: Noé Henchoz
 * Date: 2025-12-07
 * License: MIT
 */

'use server'

// ----------------------------------------------------------------------
// IMPORTS
// ----------------------------------------------------------------------

import { revalidatePath, revalidateTag } from 'next/cache'
import { redirect } from 'next/navigation'
import { authenticatedAction } from '@/lib/actions/safe-action'
import { ACTION_MESSAGES } from '@/lib/config/messages'
import { APP_ROUTES } from '@/lib/config/routes'
import {
  dbCreateTournament,
  dbDeleteTournament,
  dbToggleTournamentVisibility,
  dbUpdateTournament,
} from '@/lib/data/mutations/tournaments'
import { getTournamentExportData } from '@/lib/data/queries/tournaments'
import { TOURNAMENT_CACHE_TAGS } from '@/lib/data/tournaments'
import { getErrorMessage } from '@/lib/utils'
import {
  deleteTournamentSchema,
  exportTournamentSchema,
  toggleVisibilitySchema,
  tournamentSchema,
  updateTournamentSchema,
} from '@/lib/validations/tournament'
import { Role } from '@/prisma/generated/prisma/client'

// ----------------------------------------------------------------------
// LOGIC
// ----------------------------------------------------------------------

export const createTournament = authenticatedAction({
  schema: tournamentSchema,
  role: [Role.ADMIN, Role.SUPERADMIN],
  handler: async data => {
    try {
      await dbCreateTournament(data)
    } catch (error) {
      return {
        success: false,
        message: getErrorMessage(
          error,
          ACTION_MESSAGES.TOURNAMENTS.DB_CREATE_ERROR,
        ),
      }
    }

    revalidateTag(TOURNAMENT_CACHE_TAGS.TOURNAMENTS, 'max')
    redirect(APP_ROUTES.ADMIN_TOURNAMENTS)
  },
})

export const deleteTournament = authenticatedAction({
  schema: deleteTournamentSchema,
  role: [Role.ADMIN, Role.SUPERADMIN],
  handler: async ({ id }) => {
    try {
      await dbDeleteTournament(id)
    } catch (error) {
      return {
        success: false,
        message: getErrorMessage(
          error,
          ACTION_MESSAGES.TOURNAMENTS.DB_DELETE_ERROR,
        ),
      }
    }

    revalidateTag(TOURNAMENT_CACHE_TAGS.TOURNAMENTS, 'max')
    return {
      success: true,
      message: ACTION_MESSAGES.TOURNAMENTS.DELETE_SUCCESS,
    }
  },
})

export const updateTournament = authenticatedAction({
  schema: updateTournamentSchema,
  role: [Role.ADMIN, Role.SUPERADMIN],
  handler: async ({ id, data }) => {
    try {
      await dbUpdateTournament(id, data)
    } catch (error) {
      return {
        success: false,
        message: getErrorMessage(
          error,
          ACTION_MESSAGES.TOURNAMENTS.DB_UPDATE_ERROR,
        ),
      }
    }

    revalidateTag(TOURNAMENT_CACHE_TAGS.TOURNAMENTS, 'max')
    revalidatePath(`${APP_ROUTES.ADMIN_TOURNAMENTS}/${id}`)
    redirect(`${APP_ROUTES.ADMIN_TOURNAMENTS}/${id}`)
  },
})

export const exportTournamentData = authenticatedAction({
  schema: exportTournamentSchema,
  role: [Role.ADMIN, Role.SUPERADMIN],
  handler: async tournamentId => {
    try {
      const flattenedData = await getTournamentExportData(tournamentId)

      if (!flattenedData) {
        return {
          success: false,
          message: ACTION_MESSAGES.TOURNAMENTS.NOT_FOUND,
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
        message: ACTION_MESSAGES.TOURNAMENTS.DATABASE_ERROR,
      }
    }
  },
})

export const toggleTournamentVisibility = authenticatedAction({
  schema: toggleVisibilitySchema,
  role: [Role.ADMIN, Role.SUPERADMIN],
  handler: async ({ id, visibility }) => {
    try {
      await dbToggleTournamentVisibility(id, visibility)
    } catch (error) {
      return {
        success: false,
        message: getErrorMessage(
          error,
          ACTION_MESSAGES.TOURNAMENTS.DB_UPDATE_ERROR,
        ),
      }
    }

    revalidateTag(TOURNAMENT_CACHE_TAGS.TOURNAMENTS, 'max')
    revalidatePath(APP_ROUTES.ADMIN_TOURNAMENTS)
    revalidatePath(`${APP_ROUTES.ADMIN_TOURNAMENTS}/${id}`)
    revalidatePath(APP_ROUTES.TOURNAMENTS)

    return {
      success: true,
      message: 'Tournament visibility updated successfully.',
    }
  },
})
