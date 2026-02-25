/**
 * File: lib/services/settings.ts
 * Description: Services for fetching global settings.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import * as Sentry from '@sentry/nextjs'
import { unstable_cache } from 'next/cache'
import prisma from '@/lib/core/prisma'

export interface GlobalSettings {
  logoUrl: string | null
  twitchUsername: string | null
  twitchUrl: string | null
  instagramUrl: string | null
  tiktokUrl: string | null
  youtubeUrl: string | null
  discordUrl: string | null
}

const DEFAULT_SETTINGS: GlobalSettings = {
  logoUrl: null,
  twitchUsername: null,
  twitchUrl: null,
  instagramUrl: null,
  tiktokUrl: null,
  youtubeUrl: null,
  discordUrl: null,
}

export const getGlobalSettings = unstable_cache(
  async (): Promise<GlobalSettings> => {
    try {
      const settings = await prisma.globalSettings.findUnique({
        where: { id: 1 },
      })

      if (!settings) {
        return DEFAULT_SETTINGS
      }

      return {
        logoUrl: settings.logoUrl ?? null,
        twitchUsername: settings.twitchUsername ?? null,
        twitchUrl: settings.twitchUrl ?? null,
        instagramUrl: settings.instagramUrl ?? null,
        tiktokUrl: settings.tiktokUrl ?? null,
        youtubeUrl: settings.youtubeUrl ?? null,
        discordUrl: settings.discordUrl ?? null,
      }
    } catch (error) {
      console.error('Error fetching global settings:', error)
      Sentry.captureException(error)
      return DEFAULT_SETTINGS
    }
  },
  ['global-settings'],
  {
    revalidate: 3600, // Revalidate every hour
    tags: ['settings'], // Allow on-demand revalidation via revalidateTag('settings')
  },
)
