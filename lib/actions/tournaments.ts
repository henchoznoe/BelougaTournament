/**
 * File: lib/actions/tournaments.ts
 * Description: Server actions for creating, updating, and deleting tournaments.
 * Author: Noé Henchoz
 * Date: 2025-12-07
 * License: MIT
 */

'use server'

import { revalidatePath, revalidateTag } from 'next/cache'
import { redirect } from 'next/navigation'
import type { z } from 'zod'
import { authenticatedAction } from '@/lib/actions/safe-action'
import { validateRequestIsAdmin } from '@/lib/auth'
import { ACTION_MESSAGES } from '@/lib/config/messages'
import { APP_ROUTES } from '@/lib/config/routes'
import { CACHE_TAGS } from '@/lib/constants'
import {
  dbCreateTournament,
  dbDeleteTournament,
  dbToggleTournamentVisibility,
  dbUpdateTournament,
} from '@/lib/data/mutations/tournaments'
import prisma from '@/lib/db/prisma'
import type { ActionState } from '@/lib/types/actions'
import { tournamentSchema } from '@/lib/validations/tournament'
import { Role, type Visibility } from '@/prisma/generated/prisma/client'

// Helper Functions
// Logic - Create
// Logic - Create
export const createTournament = authenticatedAction({
  schema: tournamentSchema,
  role: [Role.ADMIN, Role.SUPERADMIN],
  handler: async data => {
    try {
      await dbCreateTournament(data)
    } catch (error) {
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : ACTION_MESSAGES.TOURNAMENTS.DB_CREATE_ERROR,
      }
    }

    revalidateTag(CACHE_TAGS.TOURNAMENTS, 'default')
    redirect(APP_ROUTES.ADMIN_TOURNAMENTS)
  },
})

// Logic - Delete
export async function deleteTournament(id: string): Promise<ActionState> {
  const error = await validateRequestIsAdmin()
  if (error) {
    return error
  }

  try {
    await dbDeleteTournament(id)
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : ACTION_MESSAGES.TOURNAMENTS.DB_DELETE_ERROR,
    }
  }

  revalidateTag(CACHE_TAGS.TOURNAMENTS, 'default')
  return {
    success: true,
    message: ACTION_MESSAGES.TOURNAMENTS.DELETE_SUCCESS,
  }
}

// Logic - Update
export async function updateTournament(
  id: string,
  data: z.infer<typeof tournamentSchema>,
): Promise<ActionState> {
  const error = await validateRequestIsAdmin()
  if (error) {
    return error
  }

  const validatedFields = tournamentSchema.safeParse(data)

  if (!validatedFields.success) {
    return {
      success: false,
      errors: validatedFields.error.flatten().fieldErrors,
      message: ACTION_MESSAGES.TOURNAMENTS.VALIDATION_ERROR,
    }
  }

  try {
    await dbUpdateTournament(id, validatedFields.data)
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : ACTION_MESSAGES.TOURNAMENTS.DB_UPDATE_ERROR,
    }
  }

  revalidateTag(CACHE_TAGS.TOURNAMENTS, 'default')
  revalidatePath(`${APP_ROUTES.ADMIN_TOURNAMENTS}/${id}`)
  redirect(APP_ROUTES.ADMIN_TOURNAMENTS)
}

// Logic - Export
export async function exportTournamentData(
  tournamentId: string,
): Promise<ActionState> {
  const error = await validateRequestIsAdmin()
  if (error) {
    return error
  }

  try {
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: {
        fields: {
          orderBy: { order: 'asc' },
        },
        registrations: {
          include: {
            players: {
              include: {
                data: true,
              },
            },
          },
        },
      },
    })

    if (!tournament) {
      return {
        success: false,
        message: ACTION_MESSAGES.TOURNAMENTS.NOT_FOUND,
      }
    }

    const fields = tournament.fields

    // Flatten data
    const flattenedData = tournament.registrations.flatMap(reg => {
      return reg.players.map(player => {
        const row: Record<string, string> = {
          'Registration ID': reg.id,
          'Team Name': reg.teamName || '',
          'Contact Email': reg.contactEmail,
          Status: reg.status,
          'Registration Date': reg.createdAt.toISOString(),
          'Player Nickname': player.nickname,
        }

        // Add dynamic fields
        for (const field of fields) {
          const playerData = player.data.find(
            d => d.tournamentFieldId === field.id,
          )
          row[field.label] = playerData ? playerData.value : ''
        }

        return row
      })
    })

    return {
      success: true,
      inputs: JSON.stringify(flattenedData),
    }
  } catch (error) {
    console.error('Export Error:', error)
    return {
      success: false,
      message: ACTION_MESSAGES.TOURNAMENTS.DATABASE_ERROR,
    }
  }
}

// Logic - Visibility
// Logic - Visibility
export async function toggleTournamentVisibility(
  id: string,
  visibility: Visibility,
): Promise<ActionState> {
  const error = await validateRequestIsAdmin()
  if (error) {
    return error
  }

  try {
    await dbToggleTournamentVisibility(id, visibility)
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : ACTION_MESSAGES.TOURNAMENTS.DB_UPDATE_ERROR,
    }
  }

  revalidateTag(CACHE_TAGS.TOURNAMENTS, 'default')
  revalidatePath(APP_ROUTES.ADMIN_TOURNAMENTS)
  revalidatePath(`${APP_ROUTES.ADMIN_TOURNAMENTS}/${id}`)
  revalidatePath(APP_ROUTES.TOURNAMENTS)

  return {
    success: true,
    message: 'Tournament visibility updated successfully.',
  }
}
