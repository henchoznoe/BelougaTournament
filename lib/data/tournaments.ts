/**
 * File: lib/data/tournaments.ts
 * Description: Data access functions for tournaments.
 * Author: Noé Henchoz
 * Date: 2025-12-07
 * License: MIT
 */

import { unstable_cache } from 'next/cache'
import prisma from '@/lib/db/prisma'
import type { Prisma } from '@/prisma/generated/prisma/client'

// Types
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

// Constants
const CACHE_CONFIG = {
  KEY_TOURNAMENTS: 'tournaments',
  KEY_TOURNAMENT_SLUG: (slug: string) => `tournament-${slug}`,
  REVALIDATE_SECONDS: 3600, // 1 hour
} as const

const fetchPublicTournamentsFromDb = async (): Promise<PublicTournament[]> => {
  return prisma.tournament.findMany({
    orderBy: { startDate: 'asc' },
    where: {
      isArchived: false,
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

/**
 * Fetches all public, active tournaments.
 * Cached for performance.
 */
export const getPublicTournaments = unstable_cache(
  fetchPublicTournamentsFromDb,
  [CACHE_CONFIG.KEY_TOURNAMENTS],
  {
    tags: [CACHE_CONFIG.KEY_TOURNAMENTS],
    revalidate: CACHE_CONFIG.REVALIDATE_SECONDS,
  },
)

/**
 * Fetches a single tournament by slug with detailed fields.
 * Cached for performance.
 */
export const getTournamentBySlug = async (
  slug: string,
): Promise<TournamentWithDetails | null> => {
  const getCachedTournament = unstable_cache(
    fetchTournamentBySlugFromDb,
    [CACHE_CONFIG.KEY_TOURNAMENT_SLUG(slug)],
    {
      tags: [CACHE_CONFIG.KEY_TOURNAMENT_SLUG(slug)],
      revalidate: CACHE_CONFIG.REVALIDATE_SECONDS,
    },
  )

  return getCachedTournament(slug)
}

/**
 * Fetches all tournaments for the admin dashboard.
 * NOT Cached to ensure real-time data for management.
 */
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
