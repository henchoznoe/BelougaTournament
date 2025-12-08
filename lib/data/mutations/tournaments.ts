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
import prisma from '@/lib/db/prisma'
import { fr } from '@/lib/i18n/dictionaries/fr'
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
      throw new Error(fr.common.server.actions.tournaments.duplicateSlug)
    }
    throw new Error(fr.common.server.actions.tournaments.createError)
  }
}

export const dbDeleteTournament = async (id: string) => {
  try {
    await prisma.tournament.delete({
      where: { id },
    })
  } catch (_error) {
    throw new Error(fr.common.server.actions.tournaments.deleteError)
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
            fr.common.server.actions.tournaments.fieldDataConstraint(
              field.label,
            ),
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
              fr.common.server.actions.tournaments.fieldSecurityError(field.id),
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
        error.message === fr.common.server.actions.tournaments.duplicateSlug ||
        error.message.includes('Impossible de supprimer le champ') ||
        error.message.includes('Erreur de sécurité')
      ) {
        throw error
      }
    }
    throw new Error(fr.common.server.actions.tournaments.updateError)
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
    throw new Error(fr.common.server.actions.tournaments.updateError)
  }
}
