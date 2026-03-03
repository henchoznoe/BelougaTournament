/**
 * File: lib/services/tournaments.ts
 * Description: Services for fetching tournaments, registrations, and teams (admin).
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import 'server-only'
import { cacheLife, cacheTag } from 'next/cache'
import { logger } from '@/lib/core/logger'
import prisma from '@/lib/core/prisma'
import type {
  TeamItem,
  TournamentDetail,
  TournamentListItem,
  TournamentRegistrationItem,
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
