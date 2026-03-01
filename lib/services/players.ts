/**
 * File: lib/services/players.ts
 * Description: Services for fetching player data for admin management.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import 'server-only'
import * as Sentry from '@sentry/nextjs'
import { cacheLife, cacheTag } from 'next/cache'
import prisma from '@/lib/core/prisma'
import type { PlayerRow } from '@/lib/types/player'

/** Fetches all users for the admin players table. */
export const getPlayers = async (): Promise<PlayerRow[]> => {
  'use cache'
  cacheLife('minutes')
  cacheTag('players')

  try {
    const rows = await prisma.user.findMany({
      where: { role: 'USER' },
      orderBy: { createdAt: 'desc' },
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
      },
    })
    return rows as unknown as PlayerRow[]
  } catch (error) {
    Sentry.captureException(error)
    return []
  }
}
