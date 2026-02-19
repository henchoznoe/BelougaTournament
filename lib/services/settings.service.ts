/**
 * File: lib/services/settings.service.ts
 * Description: Data access layer for site settings.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { unstable_cache } from 'next/cache'
import prisma from '@/lib/core/prisma'
import type { SiteSettings } from '@/prisma/generated/prisma/client'

const DB_CONFIG = {
  SINGLETON_ID: 1,
} as const

const CACHE_CONFIG = {
  KEY_SETTINGS: 'site-settings',
} as const

const DEFAULT_SETTINGS: SiteSettings = {
  id: DB_CONFIG.SINGLETON_ID,
  logoUrl: null,
  socialDiscord: null,
  socialTiktok: null,
  socialTwitch: null,
  socialInstagram: null,
  socialYoutube: null,
}

const fetchSettingsFromDb = async (): Promise<SiteSettings> => {
  const settings = await prisma.siteSettings.findUnique({
    where: { id: DB_CONFIG.SINGLETON_ID },
  })

  return settings ?? DEFAULT_SETTINGS
}

export const getSiteSettings = unstable_cache(
  fetchSettingsFromDb,
  [CACHE_CONFIG.KEY_SETTINGS],
  {
    tags: [CACHE_CONFIG.KEY_SETTINGS],
  },
)
