/**
 * File: lib/data/mutations/tournaments.ts
 * Description: Database mutation logic for tournaments.
 * Author: Noé Henchoz
 * Date: 2025-12-07
 * License: MIT
 */

import type { z } from 'zod'
import { ACTION_MESSAGES } from '@/lib/config/messages'
import prisma from '@/lib/db/prisma'
import type { tournamentSchema } from '@/lib/validations/tournament'
import { Prisma, type Visibility } from '@/prisma/generated/prisma/client'

export const dbCreateTournament = async (
  data: z.infer<typeof tournamentSchema>,
) => {
  const { fields, ...tournamentData } = data

  try {
    const result = await prisma.$transaction(async tx => {
      const tournament = await tx.tournament.create({
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
      return tournament
    })
    return result
  } catch (error) {
    console.error('Database Error:', error)
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002' &&
      (error.meta?.target as string[])?.includes('slug')
    ) {
      throw new Error(ACTION_MESSAGES.TOURNAMENTS.DUPLICATE_SLUG)
    }
    throw new Error(ACTION_MESSAGES.TOURNAMENTS.DB_CREATE_ERROR)
  }
}

export const dbDeleteTournament = async (id: string) => {
  try {
    await prisma.tournament.delete({
      where: { id },
    })
  } catch (error) {
    console.error('Delete Error:', error)
    throw new Error(ACTION_MESSAGES.TOURNAMENTS.DB_DELETE_ERROR)
  }
}

export const dbUpdateTournament = async (
  id: string,
  data: z.infer<typeof tournamentSchema>,
) => {
  const { fields, ...tournamentData } = data

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
      // Re-throw specific errors (Duplicate slug, Field constraints)
      if (
        error.message === ACTION_MESSAGES.TOURNAMENTS.DUPLICATE_SLUG ||
        error.message.includes('Cannot remove field') ||
        error.message.includes('Security Error')
      ) {
        throw error
      }
    }
    throw new Error(ACTION_MESSAGES.TOURNAMENTS.DB_UPDATE_ERROR)
  }
}

export const dbToggleTournamentVisibility = async (
  id: string,
  visibility: Visibility,
) => {
  try {
    await prisma.tournament.update({
      where: { id },
      data: { visibility },
    })
  } catch (error) {
    console.error('Visibility Update Error:', error)
    throw new Error(ACTION_MESSAGES.TOURNAMENTS.DB_UPDATE_ERROR)
  }
}
