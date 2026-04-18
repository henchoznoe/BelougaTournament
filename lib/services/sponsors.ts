/**
 * File: lib/services/sponsors.ts
 * Description: Services for fetching sponsors (public filtered and admin unfiltered).
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import 'server-only'
import { cacheLife, cacheTag } from 'next/cache'
import { CACHE_TAGS } from '@/lib/config/constants'
import { logger } from '@/lib/core/logger'
import prisma from '@/lib/core/prisma'
import type { Sponsor } from '@/prisma/generated/prisma/client'

/** Fetches only enabled sponsors (for the public landing page). */
export const getSponsors = async (): Promise<Sponsor[]> => {
  'use cache'
  cacheLife('hours')
  cacheTag(CACHE_TAGS.SPONSORS)

  try {
    return await prisma.sponsor.findMany({
      where: { enabled: true },
      orderBy: { supportedSince: 'asc' },
    })
  } catch (error) {
    logger.error({ error }, 'Error fetching sponsors')
    return []
  }
}

/** Fetches all sponsors regardless of enabled status (for admin pages). */
export const getAllSponsors = async (): Promise<Sponsor[]> => {
  'use cache'
  cacheLife('hours')
  cacheTag(CACHE_TAGS.SPONSORS)

  try {
    return await prisma.sponsor.findMany({
      orderBy: { supportedSince: 'desc' },
    })
  } catch (error) {
    logger.error({ error }, 'Error fetching all sponsors')
    return []
  }
}

/** Fetches a single sponsor by ID (for admin edit page). */
export const getSponsorById = async (id: string): Promise<Sponsor | null> => {
  'use cache'
  cacheLife('hours')
  cacheTag(CACHE_TAGS.SPONSORS)

  try {
    return await prisma.sponsor.findUnique({ where: { id } })
  } catch (error) {
    logger.error({ error }, 'Error fetching sponsor by ID')
    return null
  }
}
