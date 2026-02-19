/**
 * File: lib/services/tournament.service.ts
 * Description: Data access layer for tournaments.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { unstable_cache } from 'next/cache'
import type { z } from 'zod'
import prisma from '@/lib/core/prisma'
import type { tournamentSchema } from '@/lib/validations/tournament'
import { Prisma } from '@/prisma/generated/prisma/client'
import { Visibility } from '@/prisma/generated/prisma/enums'

export type PublicTournament = Prisma.TournamentGetPayload<{
  include: {
    _count: {
      select: {
        registrations: true
      }
    }
  }
}>

export type TournamentWithDetails = Prisma.TournamentGetPayload<{
  include: {
    fields: {
      orderBy: { order: 'asc' }
    }
    _count: {
      select: {
        registrations: true
      }
    }
  }
}>

export const TOURNAMENT_CACHE_TAGS = {
  TOURNAMENTS: 'tournaments',
  TOURNAMENT_SLUG: (slug: string) => `tournament-${slug}`,
} as const

const CACHE_CONFIG = {
  ...TOURNAMENT_CACHE_TAGS,
  REVALIDATE_SECONDS: 3600, // 1 hour
} as const

const fetchPublicTournamentsFromDb = async (): Promise<PublicTournament[]> => {
  return prisma.tournament.findMany({
    orderBy: { startDate: 'asc' },
    where: {
      visibility: Visibility.PUBLIC,
      endDate: {
        gte: new Date(),
      },
    },
    include: {
      _count: {
        select: {
          registrations: true,
        },
      },
    },
  })
}

const fetchTournamentBySlugFromDb = async (
  slug: string,
): Promise<TournamentWithDetails | null> => {
  return prisma.tournament.findUnique({
    where: { slug },
    include: {
      fields: {
        orderBy: { order: 'asc' },
      },
      _count: {
        select: {
          registrations: true,
        },
      },
    },
  })
}

export const getPublicTournaments = unstable_cache(
  fetchPublicTournamentsFromDb,
  [CACHE_CONFIG.TOURNAMENTS],
  {
    tags: [CACHE_CONFIG.TOURNAMENTS],
    revalidate: CACHE_CONFIG.REVALIDATE_SECONDS,
  },
)

export const getTournamentBySlug = async (
  slug: string,
): Promise<TournamentWithDetails | null> => {
  const getCachedTournament = unstable_cache(
    fetchTournamentBySlugFromDb,
    [CACHE_CONFIG.TOURNAMENT_SLUG(slug)],
    {
      tags: [CACHE_CONFIG.TOURNAMENT_SLUG(slug)],
      revalidate: CACHE_CONFIG.REVALIDATE_SECONDS,
    },
  )

  return getCachedTournament(slug)
}

export const getAdminTournaments = async (): Promise<PublicTournament[]> => {
  return prisma.tournament.findMany({
    orderBy: { startDate: 'desc' },
    include: {
      _count: {
        select: { registrations: true },
      },
    },
  })
}

export const getTournamentExportData = async (
  tournamentId: string,
): Promise<Record<string, string>[] | null> => {
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
    return null
  }

  const fields = tournament.fields

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

      for (const field of fields) {
        const playerData = player.data.find(
          d => d.tournamentFieldId === field.id,
        )
        row[field.label] = playerData ? playerData.value : ''
      }

      return row
    })
  })

  return flattenedData
}

export const createTournament = async (
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
      throw new Error('Slug already exists')
    }
    throw new Error('Failed to create tournament')
  }
}

export const updateTournament = async (
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
          throw new Error(`Field ${field.label} has data and cannot be deleted`)
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
              `Field ${field.id} does not belong to this tournament`,
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
        error.message === 'Slug already exists' ||
        error.message.includes('Field') ||
        error.message.includes('Security error')
      ) {
        throw error
      }
    }
    throw new Error('Failed to update tournament')
  }
}

export const deleteTournament = async (id: string) => {
  try {
    await prisma.tournament.delete({
      where: { id },
    })
  } catch (_error) {
    throw new Error('Failed to delete tournament')
  }
}

export const toggleTournamentVisibility = async (
  id: string,
  visibility: Visibility,
) => {
  try {
    await prisma.tournament.update({
      where: { id },
      data: { visibility },
    })
  } catch (_error) {
    throw new Error('Failed to update tournament visibility')
  }
}
