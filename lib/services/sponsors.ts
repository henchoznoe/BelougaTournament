/**
 * File: lib/services/sponsors.ts
 * Description: Services for fetching sponsors.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import * as Sentry from '@sentry/nextjs'
import { unstable_cache } from 'next/cache'
import prisma from '@/lib/core/prisma'
import type { Sponsor } from '@/prisma/generated/prisma/client'

export const getSponsors = unstable_cache(
  async (): Promise<Sponsor[]> => {
    try {
      return await prisma.sponsor.findMany({
        orderBy: { order: 'asc' },
        select: {
          id: true,
          name: true,
          imageUrl: true,
          url: true,
          order: true,
        },
      })
    } catch (error) {
      console.error('Error fetching sponsors:', error)
      Sentry.captureException(error)
      return []
    }
  },
  ['sponsors'],
  {
    revalidate: 3600,
    tags: ['sponsors'],
  },
)
