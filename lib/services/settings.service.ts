/**
 * File: lib/services/settings.service.ts
 * Description: Data access layer for site settings.
 */

import { unstable_cache } from 'next/cache'
import prisma from '@/lib/core/db'
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
  statsYears: null,
  statsPlayers: null,
  statsTournaments: null,
  statsMatches: null,
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

export const getLandingStats = async () => {
  const settings = await getSiteSettings()

  return {
    years: settings.statsYears,
    players: settings.statsPlayers,
    tournaments: settings.statsTournaments,
    matches: settings.statsMatches,
  }
}
