/**
 * File: lib/services/admins.ts
 * Description: Services for fetching admin users and tournament options.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import 'server-only'
import { cacheLife, cacheTag } from 'next/cache'
import { CACHE_TAGS, SEARCH_CONFIG } from '@/lib/config/constants'
import { logger } from '@/lib/core/logger'
import prisma from '@/lib/core/prisma'
import type { AdminUser, TournamentOption } from '@/lib/types/admin'
import { Role } from '@/prisma/generated/prisma/enums'

/** Fetches all users with ADMIN or SUPERADMIN role, including tournament assignments. */
export const getAdmins = async (): Promise<AdminUser[]> => {
  'use cache'
  cacheLife('minutes')
  cacheTag(CACHE_TAGS.ADMINS)

  try {
    const rows = await prisma.user.findMany({
      where: {
        role: { in: [Role.ADMIN, Role.SUPERADMIN] },
      },
      orderBy: [{ role: 'desc' }, { name: 'asc' }],
      select: {
        id: true,
        name: true,
        displayName: true,
        email: true,
        image: true,
        role: true,
        createdAt: true,
        adminOf: {
          select: {
            id: true,
            tournamentId: true,
            tournament: {
              select: {
                id: true,
                title: true,
                slug: true,
              },
            },
          },
        },
      },
    })
    return rows as unknown as AdminUser[]
  } catch (error) {
    logger.error({ error }, 'Error fetching admins')
    return []
  }
}

/** Fetches all tournaments for the assignment picker. */
export const getTournamentOptions = async (): Promise<TournamentOption[]> => {
  'use cache'
  cacheLife('minutes')
  cacheTag(CACHE_TAGS.TOURNAMENT_OPTIONS)

  try {
    const rows = await prisma.tournament.findMany({
      orderBy: [{ status: 'asc' }, { title: 'asc' }],
      select: {
        id: true,
        title: true,
        slug: true,
        status: true,
      },
    })
    return rows as unknown as TournamentOption[]
  } catch (error) {
    logger.error({ error }, 'Error fetching tournament options')
    return []
  }
}

/** Searches users by name or email (for the promote dialog). Only returns USER-role users. */
export const searchUsers = async (
  query: string,
): Promise<
  { id: string; name: string; email: string; image: string | null }[]
> => {
  if (!query || query.length < SEARCH_CONFIG.MIN_QUERY_LENGTH) return []

  try {
    const rows = await prisma.user.findMany({
      where: {
        role: Role.USER,
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: SEARCH_CONFIG.MAX_RESULTS,
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
      },
    })
    return rows as unknown as {
      id: string
      name: string
      email: string
      image: string | null
    }[]
  } catch (error) {
    logger.error({ error }, 'Error searching users')
    return []
  }
}
