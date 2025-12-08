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
import { APP_ROUTES } from '@/lib/config/routes'
import {
  dbCreateTournament,
  dbDeleteTournament,
  dbToggleTournamentVisibility,
  dbUpdateTournament,
} from '@/lib/data/mutations/tournaments'
import { getTournamentExportData } from '@/lib/data/queries/tournaments'
import { TOURNAMENT_CACHE_TAGS } from '@/lib/data/tournaments'
import { fr } from '@/lib/i18n/dictionaries/fr'
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
          fr.common.server.actions.tournaments.createError,
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
          fr.common.server.actions.tournaments.deleteError,
        ),
      }
    }

    revalidateTag(TOURNAMENT_CACHE_TAGS.TOURNAMENTS, 'max')
    return {
      success: true,
      message: fr.common.server.actions.tournaments.deleteSuccess,
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
          fr.common.server.actions.tournaments.updateError,
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
          message: fr.common.server.actions.tournaments.notFound,
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
        message: fr.common.server.actions.tournaments.databaseError,
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
          fr.common.server.actions.tournaments.updateError,
        ),
      }
    }

    revalidateTag(TOURNAMENT_CACHE_TAGS.TOURNAMENTS, 'max')
    revalidatePath(APP_ROUTES.ADMIN_TOURNAMENTS)
    revalidatePath(`${APP_ROUTES.ADMIN_TOURNAMENTS}/${id}`)
    revalidatePath(APP_ROUTES.TOURNAMENTS)

    return {
      success: true,
      message: fr.pages.admin.tournaments.detail.visibility.toastSuccess,
    }
  },
})
