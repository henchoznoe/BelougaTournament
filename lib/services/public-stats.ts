/**
 * File: lib/services/public-stats.ts
 * Description: Read-side cached aggregate stats shown on the public landing page.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import 'server-only'
import { cacheLife, cacheTag } from 'next/cache'
import { CACHE_TAGS } from '@/lib/config/constants'
import { logger } from '@/lib/core/logger'
import prisma from '@/lib/core/prisma'
import {
  RegistrationStatus,
  TournamentStatus,
} from '@/prisma/generated/prisma/enums'

export interface PublicStats {
  /** Tournaments that have been published (excludes drafts). */
  tournaments: number
  /** Registered members. */
  players: number
  /** Confirmed registrations across all tournaments. */
  registrations: number
  /** Distinct games featured across published tournaments. */
  games: number
}

const EMPTY_STATS: PublicStats = {
  tournaments: 0,
  players: 0,
  registrations: 0,
  games: 0,
}

/** Aggregates community-wide counts used as social proof on the landing page. */
export const getPublicStats = async (): Promise<PublicStats> => {
  'use cache'
  cacheLife('hours')
  cacheTag(CACHE_TAGS.TOURNAMENTS, CACHE_TAGS.USERS, CACHE_TAGS.PLAYERS)

  try {
    const [tournaments, players, registrations, gameRows] = await Promise.all([
      prisma.tournament.count({
        where: { status: { not: TournamentStatus.DRAFT } },
      }),
      prisma.user.count(),
      prisma.tournamentRegistration.count({
        where: { status: RegistrationStatus.CONFIRMED },
      }),
      prisma.tournament.findMany({
        where: { status: { not: TournamentStatus.DRAFT } },
        select: { games: true },
      }),
    ])

    const games = new Set(gameRows.flatMap(row => row.games)).size

    return { tournaments, players, registrations, games }
  } catch (error) {
    logger.error({ error }, 'Error fetching public stats')
    return EMPTY_STATS
  }
}
