/**
 * File: lib/data/settings.ts
 * Description: Data fetching utility for site settings.
 * Author: Noé Henchoz
 * Date: 2025-12-07
 * License: MIT
 */

// ----------------------------------------------------------------------
// IMPORTS
// ----------------------------------------------------------------------

import { unstable_cache } from 'next/cache'
import prisma from '@/lib/db/prisma'
import type { SiteSettings } from '@/prisma/generated/prisma/client'

// ----------------------------------------------------------------------
// CONSTANTS
// ----------------------------------------------------------------------

const DB_CONFIG = {
  // Fixed ID to enforce a singleton pattern for global settings
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
  statsYears: null,
  statsPlayers: null,
  statsTournaments: null,
  statsMatches: null,
}

// ----------------------------------------------------------------------
// LOGIC
// ----------------------------------------------------------------------

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
