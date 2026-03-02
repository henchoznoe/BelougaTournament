/**
 * File: lib/services/admins.ts
 * Description: Services for fetching admin users and tournament options.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import 'server-only'
import { cacheLife, cacheTag } from 'next/cache'
import prisma from '@/lib/core/prisma'
import type { AdminUser, TournamentOption } from '@/lib/types/admin'

/** Fetches all users with ADMIN or SUPERADMIN role, including tournament assignments. */
export const getAdmins = async (): Promise<AdminUser[]> => {
  'use cache'
  cacheLife('minutes')
  cacheTag('admins')

  try {
    const rows = await prisma.user.findMany({
      where: {
        role: { in: ['ADMIN', 'SUPERADMIN'] },
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
    console.error('Error fetching admins:', error)
    return []
  }
}

/** Fetches all tournaments for the assignment picker. */
export const getTournamentOptions = async (): Promise<TournamentOption[]> => {
  'use cache'
  cacheLife('minutes')
  cacheTag('tournament-options')

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
    console.error('Error fetching tournament options:', error)
    return []
  }
}

/** Searches users by name or email (for the promote dialog). Only returns USER-role users. */
export const searchUsers = async (
  query: string,
): Promise<
  { id: string; name: string; email: string; image: string | null }[]
> => {
  if (!query || query.length < 2) return []

  try {
    const rows = await prisma.user.findMany({
      where: {
        role: 'USER',
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: 10,
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
    console.error('Error searching users:', error)
    return []
  }
}
