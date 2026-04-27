/**
 * File: lib/services/players.ts
 * Description: Services for public player data (list and profile).
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
  PlayerProfileStatus,
  PublicPlayerListItem,
  PublicPlayerProfile,
} from '@/lib/types/player'
import {
  RegistrationStatus,
  TournamentStatus,
} from '@/prisma/generated/prisma/enums'

/** Fetches all public, non-banned players for the players list page. */
export const getPublicPlayers = async (): Promise<PublicPlayerListItem[]> => {
  'use cache'
  cacheLife('hours')
  cacheTag(CACHE_TAGS.PLAYERS)

  try {
    const rows = await prisma.user.findMany({
      where: {
        isPublic: true,
        bannedAt: null,
      },
      orderBy: { displayName: 'asc' },
      select: {
        id: true,
        displayName: true,
        image: true,
        role: true,
        createdAt: true,
        _count: {
          select: {
            registrations: {
              where: {
                status: RegistrationStatus.CONFIRMED,
                tournament: {
                  status: {
                    in: [TournamentStatus.PUBLISHED, TournamentStatus.ARCHIVED],
                  },
                },
              },
            },
          },
        },
      },
    })
    return rows.map(r => ({
      id: r.id,
      displayName: r.displayName,
      image: r.image,
      role: r.role,
      createdAt: r.createdAt,
      tournamentCount: r._count.registrations,
    }))
  } catch (error) {
    logger.error({ error }, 'Error fetching public players')
    return []
  }
}

/** Checks whether a player exists and whether their profile is public, private, or not found. */
export const getPlayerProfileStatus = async (
  userId: string,
): Promise<PlayerProfileStatus> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { isPublic: true, bannedAt: true },
    })

    if (!user || user.bannedAt !== null) return 'not_found'
    return user.isPublic ? 'public' : 'private'
  } catch (error) {
    logger.error({ error }, 'Error fetching player profile status')
    return 'not_found'
  }
}

/** Fetches a public player profile by ID. Returns null if not found, not public, or banned. */
export const getPublicPlayerProfile = async (
  userId: string,
): Promise<PublicPlayerProfile | null> => {
  'use cache'
  cacheLife('hours')
  cacheTag(CACHE_TAGS.PLAYERS)

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId, isPublic: true, bannedAt: null },
      select: {
        id: true,
        displayName: true,
        image: true,
        role: true,
        createdAt: true,
        registrations: {
          where: {
            status: RegistrationStatus.CONFIRMED,
            tournament: {
              status: {
                in: [TournamentStatus.PUBLISHED, TournamentStatus.ARCHIVED],
              },
            },
          },
          orderBy: { tournament: { startDate: 'desc' } },
          select: {
            tournament: {
              select: {
                title: true,
                slug: true,
                games: true,
                startDate: true,
                format: true,
              },
            },
          },
        },
      },
    })

    if (!user) return null

    return {
      id: user.id,
      displayName: user.displayName,
      image: user.image,
      role: user.role,
      createdAt: user.createdAt,
      tournamentHistory: user.registrations.map(r => ({
        tournamentTitle: r.tournament.title,
        tournamentSlug: r.tournament.slug,
        games: r.tournament.games,
        startDate: r.tournament.startDate,
        format: r.tournament.format,
      })),
    }
  } catch (error) {
    logger.error({ error }, 'Error fetching public player profile')
    return null
  }
}
