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
import { Role, TournamentStatus } from '@/prisma/generated/prisma/enums'

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
      totalUsers,
      players,
      admins,
      ghosts,
      totalRegistrations,
      soloRegistrations,
      teamRegistrations,
      sponsors,
    ] = await Promise.all([
      prisma.tournament.count(),
      prisma.tournament.count({ where: { status: TournamentStatus.DRAFT } }),
      prisma.tournament.count({
        where: { status: TournamentStatus.PUBLISHED },
      }),
      prisma.tournament.count({ where: { status: TournamentStatus.ARCHIVED } }),
      prisma.user.count(),
      prisma.user.count({ where: { role: Role.USER } }),
      prisma.user.count({
        where: { role: { in: [Role.ADMIN, Role.SUPERADMIN] } },
      }),
      prisma.user.count({
        where: { registrations: { none: {} } },
      }),
      prisma.tournamentRegistration.count(),
      prisma.tournamentRegistration.count({ where: { teamId: null } }),
      prisma.tournamentRegistration.count({
        where: { teamId: { not: null } },
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
      users: {
        total: totalUsers,
        players,
        admins,
        ghosts,
      },
      registrations: {
        total: totalRegistrations,
        solo: soloRegistrations,
        team: teamRegistrations,
      },
      sponsors,
    }
  } catch (error) {
    logger.error({ error }, 'Error fetching dashboard stats')
    return {
      tournaments: {
        total: 0,
        byStatus: {
          [TournamentStatus.DRAFT]: 0,
          [TournamentStatus.PUBLISHED]: 0,
          [TournamentStatus.ARCHIVED]: 0,
        },
      },
      users: {
        total: 0,
        players: 0,
        admins: 0,
        ghosts: 0,
      },
      registrations: {
        total: 0,
        solo: 0,
        team: 0,
      },
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
