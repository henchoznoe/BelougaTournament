/**
 * File: lib/config/constants.ts
 * Description: Global constants for the application.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

export const METADATA = {
  NAME: 'Belouga Tournament',
  DESCRIPTION:
    'La référence des tournois amateurs e-sport, créé par Quentadoulive.',
  TEMPLATE_TITLE: '%s | Belouga Tournament',
} as const

/** Computed once at build time — safe for prerendered components. */
export const CURRENT_YEAR = new Date().getFullYear()

export const DEFAULT_ASSETS = {
  LOGO: '/assets/logo-blue.png',
  BG_IMAGE: '/assets/wall.png',
}

export const AUTHOR = {
  URL: 'https://henchoznoe.ch',
  NAME: 'Noé Henchoz',
  EMAIL: 'henchoznoe@gmail.com',
}

/** Centralized cache tag names used with cacheTag() and revalidateTag(). */
export const CACHE_TAGS = {
  ADMINS: 'admins',
  DASHBOARD_STATS: 'dashboard-stats',
  DASHBOARD_UPCOMING: 'dashboard-upcoming',
  DASHBOARD_REGISTRATIONS: 'dashboard-registrations',
  PLAYERS: 'players',
  SETTINGS: 'settings',
  SPONSORS: 'sponsors',
  TOURNAMENTS: 'tournaments',
  TOURNAMENT_OPTIONS: 'tournament-options',
} as const
