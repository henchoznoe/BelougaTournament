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
import prisma from '@/lib/db/prisma'
import { tournamentSchema } from '@/lib/validations/tournament'
import { Prisma, Role, type Visibility } from '@/prisma/generated/prisma/client'

// Types
export type ActionState = {
  success?: boolean
  errors?: {
    [key: string]: string[]
  }
  message?: string
  data?: string // Generic data return field (e.g., for standard text or JSON string)
}

// Constants
const MESSAGES = {
  UNAUTHORIZED: 'Unauthorized: Admin access required.',
  VALIDATION_ERROR: 'Validation Error',
  DATABASE_ERROR: 'Database Error: An unexpected error occurred.',
  DB_CREATE_ERROR: 'Database Error: Failed to create tournament.',
  DB_UPDATE_ERROR: 'Database Error: Failed to update tournament.',
  DB_DELETE_ERROR: 'Database Error: Failed to delete tournament.',
  DUPLICATE_SLUG:
    'A tournament with this slug already exists. Please choose another one.',
  DELETE_SUCCESS: 'Tournament deleted successfully.',
  NOT_FOUND: 'Tournament not found.',
  FIELD_DATA_CONSTRAINT: (label: string) =>
    `Cannot remove field "${label}" as it contains user data.`,
  FIELD_SECURITY_ERROR: (id: string) =>
    `Security Error: Field "${id}" does not belong to this tournament.`,
} as const

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
      message: MESSAGES.UNAUTHORIZED,
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
      message: MESSAGES.VALIDATION_ERROR,
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
        message: MESSAGES.DUPLICATE_SLUG,
      }
    }
    return {
      success: false,
      message: MESSAGES.DB_CREATE_ERROR,
    }
  }

  revalidateTag('tournaments', 'default')
  redirect('/admin/tournaments')
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
      message: MESSAGES.DB_DELETE_ERROR,
    }
  }

  revalidateTag('tournaments', 'default')
  return {
    success: true,
    message: MESSAGES.DELETE_SUCCESS,
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
      message: MESSAGES.VALIDATION_ERROR,
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
          throw new Error(MESSAGES.FIELD_DATA_CONSTRAINT(field.label))
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
            throw new Error(MESSAGES.FIELD_SECURITY_ERROR(field.id))
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
      message: MESSAGES.DB_UPDATE_ERROR,
    }
  }

  revalidateTag('tournaments', 'default')
  revalidatePath(`/admin/tournaments/${id}`)
  redirect('/admin/tournaments')
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
        message: MESSAGES.NOT_FOUND,
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
      data: JSON.stringify(flattenedData),
    }
  } catch (error) {
    console.error('Export Error:', error)
    return {
      success: false,
      message: MESSAGES.DATABASE_ERROR,
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
      message: MESSAGES.DB_UPDATE_ERROR,
    }
  }

  revalidateTag('tournaments', 'default')
  revalidatePath('/admin/tournaments')
  revalidatePath(`/admin/tournaments/${id}`)
  revalidatePath('/tournaments')

  return {
    success: true,
    message: 'Tournament visibility updated successfully.',
  }
}
