/**
 * File: lib/config/constants/cache.ts
 * Description: Cache tag names used with cacheTag() and revalidateTag().
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

/** Centralized cache tag names used with cacheTag() and revalidateTag(). */
export const CACHE_TAGS = {
  DASHBOARD_STATS: 'dashboard-stats',
  DASHBOARD_PAYMENTS: 'dashboard-payments',
  DASHBOARD_REGISTRATIONS: 'dashboard-registrations',
  DASHBOARD_RECENT_USERS: 'dashboard-recent-users',
  SETTINGS: 'settings',
  SPONSORS: 'sponsors',
  TOURNAMENTS: 'tournaments',
  USERS: 'users',
} as const
