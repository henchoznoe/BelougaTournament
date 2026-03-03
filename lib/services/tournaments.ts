/**
 * File: lib/services/tournaments.ts
 * Description: Services for fetching tournaments (admin list, detail, by ID).
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import 'server-only'
import { cacheLife, cacheTag } from 'next/cache'
import { logger } from '@/lib/core/logger'
import prisma from '@/lib/core/prisma'
import type {
  TournamentDetail,
  TournamentListItem,
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
