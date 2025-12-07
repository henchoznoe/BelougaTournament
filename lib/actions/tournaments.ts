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
import { getSession } from '@/lib/auth'
import { ACTION_MESSAGES } from '@/lib/config/messages'
import { APP_ROUTES } from '@/lib/config/routes'
import { CACHE_TAGS } from '@/lib/constants'
import prisma from '@/lib/db/prisma'
import type { ActionState } from '@/lib/types/actions'
import { tournamentSchema } from '@/lib/validations/tournament'
import { Prisma, Role, type Visibility } from '@/prisma/generated/prisma/client'

// Helper Functions
async function checkAuth(): Promise<ActionState> {
  const session = await getSession()
  if (
    !session ||
    !session.user ||
    (session.user.role !== Role.ADMIN && session.user.role !== Role.SUPERADMIN)
  ) {
    return {
      success: false,
      message: ACTION_MESSAGES.TOURNAMENTS.UNAUTHORIZED,
    }
  }
  return { success: true }
}

// Logic - Create
export async function createTournament(
  data: z.infer<typeof tournamentSchema>,
): Promise<ActionState> {
  const auth = await checkAuth()
  if (!auth.success) {
    return auth
  }

  const validatedFields = tournamentSchema.safeParse(data)

  if (!validatedFields.success) {
    return {
      success: false,
      errors: validatedFields.error.flatten().fieldErrors,
      message: ACTION_MESSAGES.TOURNAMENTS.VALIDATION_ERROR,
    }
  }

  const { fields, ...tournamentData } = validatedFields.data

  try {
    await prisma.$transaction(async tx => {
      await tx.tournament.create({
        data: {
          ...tournamentData,
          streamUrl: tournamentData.streamUrl ?? '',
          fields: {
            create: fields.map((field, index) => ({
              ...field,
              order: index,
            })),
          },
        },
      })
    })
  } catch (error) {
    console.error('Database Error:', error)
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      (error as Prisma.PrismaClientKnownRequestError).code === 'P2002' &&
      (
        (error as Prisma.PrismaClientKnownRequestError).meta?.target as string[]
      )?.includes('slug')
    ) {
      return {
        success: false,
        message: ACTION_MESSAGES.TOURNAMENTS.DUPLICATE_SLUG,
      }
    }
    return {
      success: false,
      message: ACTION_MESSAGES.TOURNAMENTS.DB_CREATE_ERROR,
    }
  }

  revalidateTag(CACHE_TAGS.TOURNAMENTS, 'default')
  redirect(APP_ROUTES.ADMIN_TOURNAMENTS)
}

// Logic - Delete
export async function deleteTournament(id: string): Promise<ActionState> {
  const auth = await checkAuth()
  if (!auth.success) {
    return auth
  }

  try {
    await prisma.tournament.delete({
      where: { id },
    })
  } catch (error) {
    console.error('Delete Error:', error)
    return {
      success: false,
      message: ACTION_MESSAGES.TOURNAMENTS.DB_DELETE_ERROR,
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
  const auth = await checkAuth()
  if (!auth.success) {
    return auth
  }

  const validatedFields = tournamentSchema.safeParse(data)

  if (!validatedFields.success) {
    return {
      success: false,
      errors: validatedFields.error.flatten().fieldErrors,
      message: ACTION_MESSAGES.TOURNAMENTS.VALIDATION_ERROR,
    }
  }

  const { fields, ...tournamentData } = validatedFields.data

  try {
    await prisma.$transaction(async tx => {
      // 1. Fetch existing fields to check for deletions and data integrity
      const existingFields = await tx.tournamentField.findMany({
        where: { tournamentId: id },
        include: {
          _count: {
            select: { playerData: true },
          },
        },
      })

      const inputFieldIds = new Set(
        fields.filter(f => f.id).map(f => f.id as string),
      )

      // 2. Identify fields to delete
      const fieldsToDelete = existingFields.filter(
        f => !inputFieldIds.has(f.id),
      )

      // 3. Check if any field to be deleted has associated data
      for (const field of fieldsToDelete) {
        if (field._count.playerData > 0) {
          throw new Error(
            ACTION_MESSAGES.TOURNAMENTS.FIELD_DATA_CONSTRAINT(field.label),
          )
        }
      }

      // 4. Update Tournament Basic Info
      await tx.tournament.update({
        where: { id },
        data: {
          ...tournamentData,
          streamUrl: tournamentData.streamUrl ?? '',
        },
      })

      // 5. Delete safe fields
      if (fieldsToDelete.length > 0) {
        await tx.tournamentField.deleteMany({
          where: {
            id: { in: fieldsToDelete.map(f => f.id) },
          },
        })
      }

      // 6. Upsert fields (Update existing, Create new)
      for (let i = 0; i < fields.length; i++) {
        const field = fields[i]

        if (field.id) {
          // Security Check: Ensure field belongs to this tournament
          const belongsToTournament = existingFields.some(
            f => f.id === field.id,
          )
          if (!belongsToTournament) {
            throw new Error(
              ACTION_MESSAGES.TOURNAMENTS.FIELD_SECURITY_ERROR(field.id),
            )
          }

          // Update existing field
          await tx.tournamentField.update({
            where: { id: field.id },
            data: {
              label: field.label,
              required: field.required,
              type: field.type,
              order: i,
            },
          })
        } else {
          // Create new field
          await tx.tournamentField.create({
            data: {
              label: field.label,
              required: field.required,
              type: field.type,
              order: i,
              tournamentId: id,
            },
          })
        }
      }
    })
  } catch (error) {
    console.error('Update Error:', error)
    if (error instanceof Error) {
      // Return specific business rule errors
      if (
        error.message.includes('Cannot remove field') ||
        error.message.includes('Security Error')
      ) {
        return {
          success: false,
          message: error.message,
        }
      }
    }
    return {
      success: false,
      message: ACTION_MESSAGES.TOURNAMENTS.DB_UPDATE_ERROR,
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
  const auth = await checkAuth()
  if (!auth.success) {
    return auth
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
export async function toggleTournamentVisibility(
  id: string,
  visibility: Visibility,
): Promise<ActionState> {
  const auth = await checkAuth()
  if (!auth.success) {
    return auth
  }

  try {
    await prisma.tournament.update({
      where: { id },
      data: { visibility },
    })
  } catch (error) {
    console.error('Visibility Update Error:', error)
    return {
      success: false,
      message: ACTION_MESSAGES.TOURNAMENTS.DB_UPDATE_ERROR,
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
