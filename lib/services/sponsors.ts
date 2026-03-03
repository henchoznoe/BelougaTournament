/**
 * File: lib/services/sponsors.ts
 * Description: Services for fetching sponsors.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { cacheLife, cacheTag } from 'next/cache'
import { logger } from '@/lib/core/logger'
import prisma from '@/lib/core/prisma'
import type { Sponsor } from '@/prisma/generated/prisma/client'

export const getSponsors = async (): Promise<Sponsor[]> => {
  'use cache'
  cacheLife('hours')
  cacheTag('sponsors')

  try {
    return await prisma.sponsor.findMany({
      orderBy: { supportedSince: 'asc' },
    })
  } catch (error) {
    logger.error({ error }, 'Error fetching sponsors')
    return []
  }
}
