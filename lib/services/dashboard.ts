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
  RecentLogin,
  RecentRegistration,
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
        where: { role: Role.ADMIN },
      }),
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
      },
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
      },
    }
  }
}

/** Fetches users with the most recent login activity. */
export const getRecentLogins = async (limit = 8): Promise<RecentLogin[]> => {
  'use cache'
  cacheLife('minutes')
  cacheTag(CACHE_TAGS.DASHBOARD_RECENT_USERS)

  try {
    const rows = await prisma.user.findMany({
      where: { lastLoginAt: { not: null } },
      orderBy: { lastLoginAt: 'desc' },
      take: limit,
      select: {
        id: true,
        name: true,
        displayName: true,
        image: true,
        role: true,
        lastLoginAt: true,
      },
    })
    return rows as unknown as RecentLogin[]
  } catch (error) {
    logger.error({ error }, 'Error fetching recent logins')
    return []
  }
}

/** Fetches the most recent tournament registrations. */
export const getRecentRegistrations = async (
  limit = 8,
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
