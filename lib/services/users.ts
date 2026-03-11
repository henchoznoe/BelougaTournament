/**
 * File: lib/services/users.ts
 * Description: Services for fetching user data (profile and admin management).
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import 'server-only'
import { cacheLife, cacheTag } from 'next/cache'
import { CACHE_TAGS } from '@/lib/config/constants'
import { logger } from '@/lib/core/logger'
import prisma from '@/lib/core/prisma'
import type { TournamentOption, UserRow } from '@/lib/types/user'

/** Fetches the profile data for a given user ID. Returns null if not found. */
export const getUserProfile = async (userId: string) => {
  try {
    return await prisma.user.findUnique({
      where: { id: userId },
      select: {
        name: true,
        displayName: true,
        email: true,
        image: true,
        role: true,
        createdAt: true,
      },
    })
  } catch (error) {
    logger.error({ error }, 'Error fetching user profile')
    return null
  }
}

/** Fetches all users for the unified admin users table. */
export const getUsers = async (): Promise<UserRow[]> => {
  'use cache'
  cacheLife('minutes')
  cacheTag(CACHE_TAGS.USERS)

  try {
    const rows = await prisma.user.findMany({
      orderBy: [{ role: 'desc' }, { createdAt: 'desc' }],
      select: {
        id: true,
        name: true,
        displayName: true,
        email: true,
        image: true,
        discordId: true,
        role: true,
        createdAt: true,
        bannedUntil: true,
        banReason: true,
        _count: {
          select: {
            registrations: true,
          },
        },
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
    return rows as unknown as UserRow[]
  } catch (error) {
    logger.error({ error }, 'Error fetching users')
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
