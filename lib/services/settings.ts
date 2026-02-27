/**
 * File: lib/services/settings.ts
 * Description: Services for fetching global settings.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import * as Sentry from '@sentry/nextjs'
import { cacheLife, cacheTag } from 'next/cache'
import prisma from '@/lib/core/prisma'
import type { GlobalSettings } from '@/prisma/generated/prisma/client'

const DEFAULT_SETTINGS: GlobalSettings = {
  id: 1,
  logoUrl: null,
  twitchUsername: null,
  twitchUrl: null,
  instagramUrl: null,
  tiktokUrl: null,
  youtubeUrl: null,
  discordUrl: null,
}

export const getGlobalSettings = async (): Promise<GlobalSettings> => {
  'use cache'
  cacheLife('hours')
  cacheTag('settings')

  try {
    const settings = await prisma.globalSettings.findUnique({
      where: { id: 1 },
    })
    return settings ?? DEFAULT_SETTINGS
  } catch (error) {
    console.error('Error fetching global settings:', error)
    Sentry.captureException(error)
    return DEFAULT_SETTINGS
  }
}
