/**
 * File: lib/services/dashboard.ts
 * Description: Services for fetching admin dashboard statistics.
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
  DashboardStats,
  RecentRegistration,
  UpcomingTournament,
} from '@/lib/types/dashboard'
import {
  RegistrationStatus,
  Role,
  TournamentStatus,
} from '@/prisma/generated/prisma/enums'

/** Fetches aggregate stats for the dashboard cards. */
export const getDashboardStats = async (): Promise<DashboardStats> => {
  'use cache'
  cacheLife('minutes')
  cacheTag(CACHE_TAGS.DASHBOARD_STATS)

  try {
    const [
      tournaments,
      draftCount,
      publishedCount,
      archivedCount,
      players,
      pendingRegistrations,
      sponsors,
    ] = await Promise.all([
      prisma.tournament.count(),
      prisma.tournament.count({ where: { status: TournamentStatus.DRAFT } }),
      prisma.tournament.count({
        where: { status: TournamentStatus.PUBLISHED },
      }),
      prisma.tournament.count({ where: { status: TournamentStatus.ARCHIVED } }),
      prisma.user.count({ where: { role: Role.USER } }),
      prisma.tournamentRegistration.count({
        where: { status: RegistrationStatus.PENDING },
      }),
      prisma.sponsor.count(),
    ])

    return {
      tournaments: {
        total: tournaments,
        byStatus: {
          [TournamentStatus.DRAFT]: draftCount,
          [TournamentStatus.PUBLISHED]: publishedCount,
          [TournamentStatus.ARCHIVED]: archivedCount,
        },
      },
      players,
      pendingRegistrations,
      sponsors,
    }
  } catch (error) {
    logger.error({ error }, 'Error fetching dashboard stats')
    return {
      tournaments: {
        total: 0,
        byStatus: { DRAFT: 0, PUBLISHED: 0, ARCHIVED: 0 },
      },
      players: 0,
      pendingRegistrations: 0,
      sponsors: 0,
    }
  }
}

/** Fetches the next upcoming published tournaments (by start date). */
export const getUpcomingTournaments = async (
  limit = 5,
): Promise<UpcomingTournament[]> => {
  'use cache'
  cacheLife('minutes')
  cacheTag(CACHE_TAGS.DASHBOARD_UPCOMING)

  try {
    const rows = await prisma.tournament.findMany({
      where: {
        status: TournamentStatus.PUBLISHED,
        startDate: { gte: new Date() },
      },
      orderBy: { startDate: 'asc' },
      take: limit,
      select: {
        id: true,
        title: true,
        slug: true,
        game: true,
        format: true,
        teamSize: true,
        startDate: true,
        status: true,
        _count: {
          select: {
            registrations: true,
            teams: true,
          },
        },
      },
    })
    return rows as unknown as UpcomingTournament[]
  } catch (error) {
    logger.error({ error }, 'Error fetching upcoming tournaments')
    return []
  }
}

/** Fetches the most recent tournament registrations. */
export const getRecentRegistrations = async (
  limit = 5,
): Promise<RecentRegistration[]> => {
  'use cache'
  cacheLife('minutes')
  cacheTag(CACHE_TAGS.DASHBOARD_REGISTRATIONS)

  try {
    const rows = await prisma.tournamentRegistration.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        status: true,
        createdAt: true,
        user: {
          select: {
            name: true,
            image: true,
          },
        },
        tournament: {
          select: {
            id: true,
            title: true,
            slug: true,
          },
        },
        team: {
          select: {
            name: true,
          },
        },
      },
    })
    return rows as unknown as RecentRegistration[]
  } catch (error) {
    logger.error({ error }, 'Error fetching recent registrations')
    return []
  }
}
