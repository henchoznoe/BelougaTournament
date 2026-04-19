/**
 * File: lib/services/tournaments.ts
 * Description: Services for fetching tournaments, registrations, and teams (admin + public).
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import 'server-only'
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
  TeamItem,
  TournamentDetail,
  TournamentListItem,
  TournamentRegistrationItem,
  UserRegistrationItem,
  UserTournamentRegistrationState,
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
  PaymentStatus,
  RegistrationStatus,
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

/** Fetches all tournaments for the admin list table. */
export const getTournaments = async (): Promise<TournamentListItem[]> => {
  'use cache'
  cacheLife('hours')
  cacheTag(CACHE_TAGS.TOURNAMENTS)

  try {
    const rows = await prisma.tournament.findMany({
      orderBy: [{ status: 'asc' }, { startDate: 'desc' }],
      select: {
        id: true,
        title: true,
        slug: true,
        game: true,
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
      },
    })
    return rows as unknown as TournamentListItem[]
  } catch (error) {
    logger.error({ error }, 'Error fetching tournaments')
    return []
  }
}

/** Fetches a single tournament by slug (for admin edit page). */
export const getTournamentBySlug = async (
  slug: string,
): Promise<TournamentDetail | null> => {
  'use cache'
  cacheLife('hours')
  cacheTag(CACHE_TAGS.TOURNAMENTS)

  try {
    const row = await prisma.tournament.findUnique({
      where: { slug },
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
    return row as unknown as TournamentDetail | null
  } catch (error) {
    logger.error({ error }, 'Error fetching tournament by slug')
    return null
  }
}

/** Fetches a single tournament by ID (for server actions). */
export const getTournamentById = async (
  id: string,
): Promise<TournamentDetail | null> => {
  'use cache'
  cacheLife('hours')
  cacheTag(CACHE_TAGS.TOURNAMENTS)

  try {
    const row = await prisma.tournament.findUnique({
      where: { id },
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
    return row as unknown as TournamentDetail | null
  } catch (error) {
    logger.error({ error }, 'Error fetching tournament by ID')
    return null
  }
}

/** Raw row shape returned by Prisma before post-processing (getRegistrations). */
type RawTournamentRegistrationRow = Omit<
  TournamentRegistrationItem,
  'team' | 'user'
> & {
  user: TournamentRegistrationItem['user'] & {
    teamMembers: {
      team: {
        id: string
        name: string
        captainId: string
        isFull: boolean
      }
    }[]
  }
  team: { id: string; name: string } | null
}

/** Fetches all registrations for a tournament (admin registrations tab). */
export const getRegistrations = async (
  tournamentId: string,
): Promise<TournamentRegistrationItem[]> => {
  'use cache'
  cacheLife('hours')
  cacheTag(CACHE_TAGS.TOURNAMENTS)

  try {
    const rows = (await prisma.tournamentRegistration.findMany({
      where: {
        tournamentId,
        status: {
          in: [RegistrationStatus.PENDING, RegistrationStatus.CONFIRMED],
        },
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        fieldValues: true,
        createdAt: true,
        status: true,
        paymentStatus: true,
        user: {
          select: {
            id: true,
            name: true,
            displayName: true,
            image: true,
            teamMembers: {
              where: { team: { tournamentId } },
              select: {
                team: {
                  select: {
                    id: true,
                    name: true,
                    captainId: true,
                    isFull: true,
                  },
                },
              },
            },
          },
        },
        team: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })) as unknown as RawTournamentRegistrationRow[]

    // Post-process: resolve team from TeamMember for all players (not just captains)
    return rows.map(row => {
      const membership = row.user.teamMembers[0]
      const team = membership
        ? {
            id: membership.team.id,
            name: membership.team.name,
            captainId: membership.team.captainId,
            isFull: membership.team.isFull,
          }
        : null

      const { teamMembers: _, ...user } = row.user
      return { ...row, user, team }
    })
  } catch (error) {
    logger.error({ error }, 'Error fetching registrations')
    return []
  }
}

/** Fetches all teams for a tournament (admin teams tab). */
export const getTeams = async (tournamentId: string): Promise<TeamItem[]> => {
  'use cache'
  cacheLife('hours')
  cacheTag(CACHE_TAGS.TOURNAMENTS)

  try {
    const rows = await prisma.team.findMany({
      where: { tournamentId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        isFull: true,
        createdAt: true,
        captain: {
          select: {
            id: true,
            name: true,
            displayName: true,
            image: true,
          },
        },
        members: {
          orderBy: { joinedAt: 'asc' },
          select: {
            id: true,
            joinedAt: true,
            user: {
              select: {
                id: true,
                name: true,
                displayName: true,
                image: true,
              },
            },
          },
        },
      },
    })
    return rows as unknown as TeamItem[]
  } catch (error) {
    logger.error({ error }, 'Error fetching teams')
    return []
  }
}

// ---------------------------------------------------------------------------
// Public services
// ---------------------------------------------------------------------------

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
    return row as unknown as PublicTournamentDetail | null
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
// User registration state (public tournament detail page)
// ---------------------------------------------------------------------------

/** Fetches the current registration state for a user on a tournament, if any active record exists.
 *  NOTE: 'use cache' is intentionally absent — this is user-specific data that must never be shared
 *  across users via the shared cache. It is called per-request with the user's session. */
export const getUserTournamentRegistrationState = async (
  userId: string,
  tournamentId: string,
): Promise<UserTournamentRegistrationState | null> => {
  try {
    const row = await prisma.tournamentRegistration.findFirst({
      where: {
        tournamentId,
        userId,
        status: {
          in: [RegistrationStatus.PENDING, RegistrationStatus.CONFIRMED],
        },
      },
      select: {
        id: true,
        status: true,
        paymentStatus: true,
        expiresAt: true,
      },
    })

    return row as UserTournamentRegistrationState | null
  } catch (error) {
    logger.error({ error }, 'Error fetching user tournament registration state')
    return null
  }
}

// ---------------------------------------------------------------------------
// User registration services (profile page)
// ---------------------------------------------------------------------------

/** Shared select for user registration items. */
const USER_REGISTRATION_SELECT = {
  id: true,
  fieldValues: true,
  createdAt: true,
  status: true,
  paymentStatus: true,
  tournament: {
    select: {
      id: true,
      title: true,
      slug: true,
      game: true,
      format: true,
      startDate: true,
      status: true,
      fields: {
        orderBy: { order: 'asc' as const },
        select: {
          id: true,
          label: true,
          type: true,
          required: true,
          order: true,
        },
      },
    },
  },
} as const

/** Fetches a user's registrations for PUBLISHED tournaments (active inscriptions). */
export const getUserRegistrations = async (
  userId: string,
): Promise<UserRegistrationItem[]> => {
  'use cache'
  cacheLife('hours')
  cacheTag(CACHE_TAGS.TOURNAMENTS)

  try {
    const rows = await prisma.tournamentRegistration.findMany({
      where: {
        userId,
        status: {
          in: [RegistrationStatus.PENDING, RegistrationStatus.CONFIRMED],
        },
        tournament: { status: TournamentStatus.PUBLISHED },
      },
      orderBy: { createdAt: 'desc' },
      select: USER_REGISTRATION_SELECT,
    })
    return rows as unknown as UserRegistrationItem[]
  } catch (error) {
    logger.error({ error }, 'Error fetching user registrations')
    return []
  }
}

/** Fetches a user's registrations for ARCHIVED tournaments (history). */
export const getUserPastRegistrations = async (
  userId: string,
): Promise<UserRegistrationItem[]> => {
  'use cache'
  cacheLife('hours')
  cacheTag(CACHE_TAGS.TOURNAMENTS)

  try {
    const rows = await prisma.tournamentRegistration.findMany({
      where: {
        userId,
        OR: [
          {
            status: RegistrationStatus.CONFIRMED,
            tournament: { status: TournamentStatus.ARCHIVED },
          },
          {
            status: RegistrationStatus.CANCELLED,
            paymentStatus: PaymentStatus.REFUNDED,
            tournament: { status: TournamentStatus.ARCHIVED },
          },
        ],
      },
      orderBy: { createdAt: 'desc' },
      select: USER_REGISTRATION_SELECT,
    })
    return rows as unknown as UserRegistrationItem[]
  } catch (error) {
    logger.error({ error }, 'Error fetching user past registrations')
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

/** Fetches PUBLISHED tournaments with search, format/type filters, sort, and pagination. */
export const getPublishedTournamentsFiltered = async (
  filters: PublicTournamentFilters,
): Promise<PublicTournamentPage> => {
  'use cache'
  cacheLife('hours')
  cacheTag(CACHE_TAGS.TOURNAMENTS)

  const { search, format, type, sort, page } = filters
  const skip = (page - 1) * PUBLIC_TOURNAMENTS_PAGE_SIZE

  const where = {
    status: TournamentStatus.PUBLISHED,
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
    logger.error({ error }, 'Error fetching filtered published tournaments')
    return {
      tournaments: [],
      total: 0,
      page,
      pageSize: PUBLIC_TOURNAMENTS_PAGE_SIZE,
      totalPages: 1,
    }
  }
}

/** Fetches ARCHIVED tournaments with search, format/type filters, sort, and pagination. */
export const getArchivedTournamentsFiltered = async (
  filters: PublicTournamentFilters,
): Promise<PublicTournamentPage> => {
  'use cache'
  cacheLife('hours')
  cacheTag(CACHE_TAGS.TOURNAMENTS)

  const { search, format, type, sort, page } = filters
  const skip = (page - 1) * PUBLIC_TOURNAMENTS_PAGE_SIZE

  const where = {
    status: TournamentStatus.ARCHIVED,
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
    logger.error({ error }, 'Error fetching filtered archived tournaments')
    return {
      tournaments: [],
      total: 0,
      page,
      pageSize: PUBLIC_TOURNAMENTS_PAGE_SIZE,
      totalPages: 1,
    }
  }
}
