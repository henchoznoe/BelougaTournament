/**
 * File: lib/services/sitemap.ts
 * Description: Cached read-side data used to generate the public sitemap.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import 'server-only'
import { cacheLife, cacheTag } from 'next/cache'
import { CACHE_TAGS } from '@/lib/config/constants/cache'
import { logger } from '@/lib/core/logger'
import prisma from '@/lib/core/prisma'
import { TournamentStatus } from '@/prisma/generated/prisma/enums'

export interface TournamentSitemapEntry {
  slug: string
  updatedAt: Date
}

/** Published and archived tournament URLs change only after an admin mutation. */
export const getTournamentSitemapEntries = async (): Promise<
  TournamentSitemapEntry[]
> => {
  'use cache'
  cacheLife('max')
  cacheTag(CACHE_TAGS.TOURNAMENTS_SITEMAP)

  try {
    return await prisma.tournament.findMany({
      where: {
        status: {
          in: [TournamentStatus.PUBLISHED, TournamentStatus.ARCHIVED],
        },
      },
      orderBy: { slug: 'asc' },
      select: { slug: true, updatedAt: true },
    })
  } catch (error) {
    logger.error({ error }, 'Failed to fetch tournaments for sitemap')
    return []
  }
}
