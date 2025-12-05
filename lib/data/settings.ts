/**
 * File: lib/data/settings.ts
 * Description: Data fetching utility for site settings.
 * Author: Noé Henchoz
 * Date: 2025-12-05
 * License: MIT
 */

import { unstable_cache } from 'next/cache'
import prisma from '@/lib/prisma'

// Constants
const DB_CONFIG = {
    // Fixed ID to enforce a singleton pattern for global settings
    SINGLETON_ID: 1,
} as const

const CACHE_CONFIG = {
    KEY_SETTINGS: 'site-settings',
} as const

const fetchSettingsFromDb = async () => {
    return prisma.siteSettings.upsert({
        where: { id: DB_CONFIG.SINGLETON_ID },
        update: {},
        create: {
            id: DB_CONFIG.SINGLETON_ID,
        },
    })
}

export const getSiteSettings = unstable_cache(
    fetchSettingsFromDb,
    [CACHE_CONFIG.KEY_SETTINGS],
    {
        tags: [CACHE_CONFIG.KEY_SETTINGS],
    },
)
