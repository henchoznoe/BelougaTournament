/**
 * File: lib/services/tournaments-public.ts
 * Description: Public tournament services (list, detail, hero badge, filtered/paginated).
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import 'server-only'
// $queryRaw returns `unknown[]`; casts below assert the shape matches our domain types
// because Prisma cannot infer types from raw SQL at compile time.
import { cacheLife, cacheTag } from 'next/cache'
import { CACHE_TAGS } from '@/lib/config/constants'
import { logger } from '@/lib/core/logger'
import prisma from '@/lib/core/prisma'
import type {
  AvailableTeam,
  HeroTournamentBadge,
  HeroTournamentBadgeData,
  HeroTournamentBadgeTournament,
  PublicTournamentDetail,
  PublicTournamentListItem,
} from '@/lib/types/tournament'
import {
  DEFAULT_HERO_TOURNAMENT_BADGE,
  resolveHeroTournamentBadge,
} from '@/lib/utils/hero-tournament-badge'
import type {
  PublicTournamentFilters,
  TournamentSortOption,
} from '@/lib/validations/tournaments'
import {
  type RegistrationType,
  type TournamentFormat,
  TournamentStatus,
} from '@/prisma/generated/prisma/enums'

/** Shared select for the landing hero badge. */
const HERO_BADGE_SELECT = {
  title: true,
  startDate: true,
  endDate: true,
} as const

/** Shared select for public tournament list items. */
const PUBLIC_LIST_SELECT = {
  id: true,
  title: true,
  slug: true,
  description: true,
  game: true,
  imageUrls: true,
  format: true,
  teamSize: true,
  maxTeams: true,
  registrationType: true,
  entryFeeAmount: true,
  entryFeeCurrency: true,
  status: true,
  startDate: true,
  endDate: true,
  registrationOpen: true,
  registrationClose: true,
  _count: {
    select: {
      registrations: true,
      teams: true,
    },
  },
} as const

/** Fetches all PUBLISHED tournaments for the public list page. */
export const getPublishedTournaments = async (): Promise<
  PublicTournamentListItem[]
> => {
  'use cache'
  cacheLife('hours')
  cacheTag(CACHE_TAGS.TOURNAMENTS)

  try {
    const rows = await prisma.tournament.findMany({
      where: { status: TournamentStatus.PUBLISHED },
      orderBy: { startDate: 'asc' },
      select: PUBLIC_LIST_SELECT,
    })
    return rows as unknown as PublicTournamentListItem[]
  } catch (error) {
    logger.error({ error }, 'Error fetching published tournaments')
    return []
  }
}

/** Fetches the badge data used by the landing hero. */
export const getHeroTournamentBadgeData =
  async (): Promise<HeroTournamentBadgeData> => {
    'use cache'
    cacheLife('hours')
    cacheTag(CACHE_TAGS.TOURNAMENTS)

    try {
      const tournaments = (await prisma.tournament.findMany({
        where: { status: TournamentStatus.PUBLISHED },
        orderBy: { startDate: 'asc' },
        select: HERO_BADGE_SELECT,
      })) as HeroTournamentBadgeTournament[]

      return {
        badge: resolveHeroTournamentBadge(tournaments),
        tournaments,
      }
    } catch (error) {
      logger.error({ error }, 'Error fetching landing hero tournament badge')
      return {
        badge: DEFAULT_HERO_TOURNAMENT_BADGE,
        tournaments: [],
      }
    }
  }

/** Fetches the tournament state displayed in the landing hero badge. */
export const getHeroTournamentBadge =
  async (): Promise<HeroTournamentBadge> => {
    const data = await getHeroTournamentBadgeData()
    return data.badge
  }

/** Fetches all ARCHIVED tournaments for the public archive page. */
export const getArchivedTournaments = async (): Promise<
  PublicTournamentListItem[]
> => {
  'use cache'
  cacheLife('hours')
  cacheTag(CACHE_TAGS.TOURNAMENTS)

  try {
    const rows = await prisma.tournament.findMany({
      where: { status: TournamentStatus.ARCHIVED },
      orderBy: { startDate: 'desc' },
      select: PUBLIC_LIST_SELECT,
    })
    return rows as unknown as PublicTournamentListItem[]
  } catch (error) {
    logger.error({ error }, 'Error fetching archived tournaments')
    return []
  }
}

/** Fetches a single PUBLISHED or ARCHIVED tournament by slug (public detail page). */
export const getPublicTournamentBySlug = async (
  slug: string,
): Promise<PublicTournamentDetail | null> => {
  'use cache'
  cacheLife('hours')
  cacheTag(CACHE_TAGS.TOURNAMENTS)

  try {
    const row = await prisma.tournament.findFirst({
      where: {
        slug,
        status: { in: [TournamentStatus.PUBLISHED, TournamentStatus.ARCHIVED] },
      },
      include: {
        fields: {
          orderBy: { order: 'asc' },
        },
        toornamentStages: {
          orderBy: { number: 'asc' },
        },
        _count: {
          select: {
            registrations: true,
            teams: true,
          },
        },
      },
    })
    return row as PublicTournamentDetail | null
  } catch (error) {
    logger.error({ error }, 'Error fetching public tournament by slug')
    return null
  }
}

/** Fetches non-full teams for a tournament (public registration dropdown). */
export const getAvailableTeams = async (
  tournamentId: string,
): Promise<AvailableTeam[]> => {
  'use cache'
  cacheLife('hours')
  cacheTag(CACHE_TAGS.TOURNAMENTS)

  try {
    const rows = await prisma.team.findMany({
      where: { tournamentId, isFull: false },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        name: true,
        captain: {
          select: {
            displayName: true,
          },
        },
        _count: {
          select: {
            members: true,
          },
        },
      },
    })
    return rows as unknown as AvailableTeam[]
  } catch (error) {
    logger.error({ error }, 'Error fetching available teams')
    return []
  }
}

// ---------------------------------------------------------------------------
// Public filtered + paginated tournament lists
// ---------------------------------------------------------------------------

export const PUBLIC_TOURNAMENTS_PAGE_SIZE = 6

/** Result type for filtered + paginated public tournament queries. */
type PublicTournamentPage = {
  tournaments: PublicTournamentListItem[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

/** Builds the Prisma orderBy clause from a sort option. */
const buildOrderBy = (sort: TournamentSortOption) => {
  switch (sort) {
    case 'date_asc':
      return { startDate: 'asc' as const }
    case 'date_desc':
      return { startDate: 'desc' as const }
    case 'title_asc':
      return { title: 'asc' as const }
    case 'title_desc':
      return { title: 'desc' as const }
    case 'registrations_desc':
      // Prisma doesn't support count-based orderBy directly; fallback to startDate desc
      return { startDate: 'desc' as const }
  }
}

/** Shared implementation for filtered + paginated public tournament queries by status. */
const getTournamentsFilteredByStatus = async (
  status: TournamentStatus,
  filters: PublicTournamentFilters,
): Promise<PublicTournamentPage> => {
  'use cache'
  cacheLife('hours')
  cacheTag(CACHE_TAGS.TOURNAMENTS)

  const { search, format, type, sort, page } = filters
  const skip = (page - 1) * PUBLIC_TOURNAMENTS_PAGE_SIZE

  const where = {
    status,
    ...(search
      ? {
          OR: [
            { title: { contains: search, mode: 'insensitive' as const } },
            { game: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {}),
    ...(format ? { format: format as TournamentFormat } : {}),
    ...(type ? { registrationType: type as RegistrationType } : {}),
  }

  try {
    const [rows, total] = await Promise.all([
      prisma.tournament.findMany({
        where,
        orderBy: buildOrderBy(sort),
        skip,
        take: PUBLIC_TOURNAMENTS_PAGE_SIZE,
        select: PUBLIC_LIST_SELECT,
      }),
      prisma.tournament.count({ where }),
    ])

    // For registrations_desc, sort in-memory after fetch
    const sorted =
      sort === 'registrations_desc'
        ? (rows as unknown as PublicTournamentListItem[]).sort(
            (a, b) => b._count.registrations - a._count.registrations,
          )
        : (rows as unknown as PublicTournamentListItem[])

    return {
      tournaments: sorted,
      total,
      page,
      pageSize: PUBLIC_TOURNAMENTS_PAGE_SIZE,
      totalPages: Math.max(1, Math.ceil(total / PUBLIC_TOURNAMENTS_PAGE_SIZE)),
    }
  } catch (error) {
    logger.error(
      { error },
      `Error fetching filtered ${status.toLowerCase()} tournaments`,
    )
    return {
      tournaments: [],
      total: 0,
      page,
      pageSize: PUBLIC_TOURNAMENTS_PAGE_SIZE,
      totalPages: 1,
    }
  }
}

/** Fetches PUBLISHED tournaments with search, format/type filters, sort, and pagination. */
export const getPublishedTournamentsFiltered = async (
  filters: PublicTournamentFilters,
): Promise<PublicTournamentPage> => {
  return getTournamentsFilteredByStatus(TournamentStatus.PUBLISHED, filters)
}

/** Fetches ARCHIVED tournaments with search, format/type filters, sort, and pagination. */
export const getArchivedTournamentsFiltered = async (
  filters: PublicTournamentFilters,
): Promise<PublicTournamentPage> => {
  return getTournamentsFilteredByStatus(TournamentStatus.ARCHIVED, filters)
}
