/**
 * File: lib/services/settings.ts
 * Description: Services for fetching global settings.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import 'server-only'
import { cacheLife, cacheTag } from 'next/cache'
import { CACHE_TAGS, SETTINGS_SINGLETON_ID } from '@/lib/config/constants'
import { logger } from '@/lib/core/logger'
import prisma from '@/lib/core/prisma'
import type { GlobalSettings } from '@/prisma/generated/prisma/client'

const DEFAULT_SETTINGS: GlobalSettings = {
  id: SETTINGS_SINGLETON_ID,
  logoUrl: null,
  twitchUsername: null,
  twitchUrl: null,
  instagramUrl: null,
  tiktokUrl: null,
  youtubeUrl: null,
  discordUrl: null,
  feature1Title: null,
  feature1Description: null,
  feature2Title: null,
  feature2Description: null,
  feature3Title: null,
  feature3Description: null,
}

export const getGlobalSettings = async (): Promise<GlobalSettings> => {
  'use cache'
  cacheLife('hours')
  cacheTag(CACHE_TAGS.SETTINGS)

  try {
    const settings = await prisma.globalSettings.findUnique({
      where: { id: SETTINGS_SINGLETON_ID },
    })
    return settings ?? DEFAULT_SETTINGS
  } catch (error) {
    logger.error({ error }, 'Error fetching global settings')
    return DEFAULT_SETTINGS
  }
}
