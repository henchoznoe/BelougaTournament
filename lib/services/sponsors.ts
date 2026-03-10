/**
 * File: lib/services/sponsors.ts
 * Description: Services for fetching sponsors.
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

export const getSponsors = async (): Promise<Sponsor[]> => {
  'use cache'
  cacheLife('hours')
  cacheTag(CACHE_TAGS.SPONSORS)

  try {
    return await prisma.sponsor.findMany({
      orderBy: { supportedSince: 'asc' },
    })
  } catch (error) {
    logger.error({ error }, 'Error fetching sponsors')
    return []
  }
}
