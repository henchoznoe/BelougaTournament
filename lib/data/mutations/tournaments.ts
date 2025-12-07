/**
 * File: lib/data/mutations/tournaments.ts
 * Description: Database mutation logic for tournaments.
 * Author: Noé Henchoz
 * Date: 2025-12-07
 * License: MIT
 */

// ----------------------------------------------------------------------
// IMPORTS
// ----------------------------------------------------------------------

import type { z } from 'zod'
import { ACTION_MESSAGES } from '@/lib/config/messages'
import prisma from '@/lib/db/prisma'
import type { tournamentSchema } from '@/lib/validations/tournament'
import { Prisma, type Visibility } from '@/prisma/generated/prisma/client'

// ----------------------------------------------------------------------
// LOGIC
// ----------------------------------------------------------------------

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
  } catch (_error) {
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

      const fieldsToDelete = existingFields.filter(
        f => !inputFieldIds.has(f.id),
      )

      for (const field of fieldsToDelete) {
        if (field._count.playerData > 0) {
          throw new Error(
            ACTION_MESSAGES.TOURNAMENTS.FIELD_DATA_CONSTRAINT(field.label),
          )
        }
      }

      await tx.tournament.update({
        where: { id },
        data: {
          ...tournamentData,
          streamUrl: tournamentData.streamUrl ?? '',
        },
      })

      if (fieldsToDelete.length > 0) {
        await tx.tournamentField.deleteMany({
          where: {
            id: { in: fieldsToDelete.map(f => f.id) },
          },
        })
      }

      for (let i = 0; i < fields.length; i++) {
        const field = fields[i]

        if (field.id) {
          const belongsToTournament = existingFields.some(
            f => f.id === field.id,
          )
          if (!belongsToTournament) {
            throw new Error(
              ACTION_MESSAGES.TOURNAMENTS.FIELD_SECURITY_ERROR(field.id),
            )
          }

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
    if (error instanceof Error) {
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
  } catch (_error) {
    throw new Error(ACTION_MESSAGES.TOURNAMENTS.DB_UPDATE_ERROR)
  }
}
