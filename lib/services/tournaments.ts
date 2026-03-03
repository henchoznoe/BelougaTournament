/**
 * File: lib/services/tournaments.ts
 * Description: Services for fetching tournaments, registrations, and teams (admin + public).
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import 'server-only'
import { cacheLife, cacheTag } from 'next/cache'
import { logger } from '@/lib/core/logger'
import prisma from '@/lib/core/prisma'
import type {
  PublicTournamentDetail,
  PublicTournamentListItem,
  TeamItem,
  TournamentDetail,
  TournamentListItem,
  TournamentRegistrationItem,
  UserRegistrationItem,
} from '@/lib/types/tournament'

/** Fetches all tournaments for the admin list table. */
export const getTournaments = async (): Promise<TournamentListItem[]> => {
  'use cache'
  cacheLife('hours')
  cacheTag('tournaments')

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
        status: true,
        startDate: true,
        endDate: true,
        registrationOpen: true,
        registrationClose: true,
        autoApprove: true,
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
  cacheTag('tournaments')

  try {
    const row = await prisma.tournament.findUnique({
      where: { slug },
      include: {
        fields: {
          orderBy: { order: 'asc' },
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
  cacheTag('tournaments')

  try {
    const row = await prisma.tournament.findUnique({
      where: { id },
      include: {
        fields: {
          orderBy: { order: 'asc' },
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

/** Fetches all registrations for a tournament (admin registrations tab). */
export const getRegistrations = async (
  tournamentId: string,
): Promise<TournamentRegistrationItem[]> => {
  'use cache'
  cacheLife('hours')
  cacheTag('tournaments')

  try {
    const rows = await prisma.tournamentRegistration.findMany({
      where: { tournamentId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        status: true,
        fieldValues: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            name: true,
            displayName: true,
            image: true,
          },
        },
        team: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })
    return rows as unknown as TournamentRegistrationItem[]
  } catch (error) {
    logger.error({ error }, 'Error fetching registrations')
    return []
  }
}

/** Fetches all teams for a tournament (admin teams tab). */
export const getTeams = async (tournamentId: string): Promise<TeamItem[]> => {
  'use cache'
  cacheLife('hours')
  cacheTag('tournaments')

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
        registration: {
          select: {
            id: true,
            status: true,
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
  imageUrl: true,
  format: true,
  teamSize: true,
  maxTeams: true,
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
  cacheTag('tournaments')

  try {
    const rows = await prisma.tournament.findMany({
      where: { status: 'PUBLISHED' },
      orderBy: { startDate: 'asc' },
      select: PUBLIC_LIST_SELECT,
    })
    return rows as unknown as PublicTournamentListItem[]
  } catch (error) {
    logger.error({ error }, 'Error fetching published tournaments')
    return []
  }
}

/** Fetches all ARCHIVED tournaments for the public archive page. */
export const getArchivedTournaments = async (): Promise<
  PublicTournamentListItem[]
> => {
  'use cache'
  cacheLife('hours')
  cacheTag('tournaments')

  try {
    const rows = await prisma.tournament.findMany({
      where: { status: 'ARCHIVED' },
      orderBy: { startDate: 'desc' },
      select: PUBLIC_LIST_SELECT,
    })
    return rows as unknown as PublicTournamentListItem[]
  } catch (error) {
    logger.error({ error }, 'Error fetching archived tournaments')
    return []
  }
}

/** Fetches a single PUBLISHED tournament by slug (public detail page). */
export const getPublicTournamentBySlug = async (
  slug: string,
): Promise<PublicTournamentDetail | null> => {
  'use cache'
  cacheLife('hours')
  cacheTag('tournaments')

  try {
    const row = await prisma.tournament.findFirst({
      where: { slug, status: { in: ['PUBLISHED', 'ARCHIVED'] } },
      include: {
        fields: {
          orderBy: { order: 'asc' },
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

// ---------------------------------------------------------------------------
// User registration services (profile page)
// ---------------------------------------------------------------------------

/** Shared select for user registration items. */
const USER_REGISTRATION_SELECT = {
  id: true,
  status: true,
  createdAt: true,
  tournament: {
    select: {
      title: true,
      slug: true,
      game: true,
      format: true,
      startDate: true,
      status: true,
    },
  },
} as const

/** Fetches a user's registrations for PUBLISHED tournaments (active inscriptions). */
export const getUserRegistrations = async (
  userId: string,
): Promise<UserRegistrationItem[]> => {
  'use cache'
  cacheLife('hours')
  cacheTag('tournaments')

  try {
    const rows = await prisma.tournamentRegistration.findMany({
      where: {
        userId,
        tournament: { status: 'PUBLISHED' },
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
  cacheTag('tournaments')

  try {
    const rows = await prisma.tournamentRegistration.findMany({
      where: {
        userId,
        tournament: { status: 'ARCHIVED' },
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
