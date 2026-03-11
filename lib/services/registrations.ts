/**
 * File: lib/services/registrations.ts
 * Description: Services for fetching all tournament registrations (global admin page).
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import 'server-only'
import { cacheLife, cacheTag } from 'next/cache'
import { CACHE_TAGS } from '@/lib/config/constants'
import { logger } from '@/lib/core/logger'
import prisma from '@/lib/core/prisma'
import type { RegistrationRow } from '@/lib/types/registration'

/** Fetches all tournament registrations for the global admin registrations page. */
export const getAllRegistrations = async (): Promise<RegistrationRow[]> => {
  'use cache'
  cacheLife('minutes')
  cacheTag(CACHE_TAGS.REGISTRATIONS)

  try {
    const rows = await prisma.tournamentRegistration.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            name: true,
            displayName: true,
            image: true,
          },
        },
        tournament: {
          select: {
            id: true,
            title: true,
            slug: true,
            format: true,
            status: true,
          },
        },
        team: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })
    return rows as unknown as RegistrationRow[]
  } catch (error) {
    logger.error({ error }, 'Error fetching all registrations')
    return []
  }
}
