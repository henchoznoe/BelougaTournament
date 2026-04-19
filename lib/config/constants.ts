/**
 * File: lib/config/constants.ts
 * Description: Global constants for the application.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { TournamentStatus } from '@/prisma/generated/prisma/enums'

export const METADATA = {
  NAME: 'Belouga Tournament',
  DESCRIPTION:
    'La référence des tournois amateurs e-sport, créé par Quentadoulive.',
  TEMPLATE_TITLE: '%s | Belouga Tournament',
} as const

export const DEFAULT_ASSETS = {
  LOGO: '/assets/logo-blue.png',
  BG_IMAGE: '/assets/wall.png',
} as const

export const AUTHOR = {
  URL: 'https://henchoznoe.ch',
  NAME: 'Noé Henchoz',
  EMAIL: 'henchoznoe@gmail.com',
} as const

/** Singleton ID for the GlobalSettings row (single-row table pattern). */
export const SETTINGS_SINGLETON_ID = 1

/** Discord API endpoints and CDN patterns. */
export const DISCORD = {
  API_USER_URL: 'https://discord.com/api/users/@me',
  AVATAR_CDN_URL: (userId: string, avatarHash: string) =>
    `https://cdn.discordapp.com/avatars/${userId}/${avatarHash}.png`,
} as const

/** Session and rate limit configuration values. */
export const AUTH_CONFIG = {
  SESSION_EXPIRES_IN: 60 * 60 * 24 * 7, // 7 days
  SESSION_UPDATE_AGE: 60 * 60 * 24, // 24 hours
  COOKIE_CACHE_MAX_AGE: 5 * 60, // 5 minutes
  RATE_LIMIT_WINDOW: 60, // 60 seconds
  RATE_LIMIT_MAX: 30, // 30 requests per window
} as const

/** Suffix used to set date to noon UTC, avoiding timezone-induced day shifts. */
export const NOON_UTC_SUFFIX = 'T12:00:00.000Z'

/** Constraints for admin user search queries. */
export const SEARCH_CONFIG = {
  MIN_QUERY_LENGTH: 2,
  MAX_RESULTS: 10,
} as const

/** Maximum length for Twitch username. */
export const TWITCH_USERNAME_MAX_LENGTH = 25

/** Default currency for tournament entry fees. Extend this if multi-currency support is added. */
export const DEFAULT_CURRENCY = 'CHF' as const

/** French labels for tournament statuses. */
export const TOURNAMENT_STATUS_LABELS: Record<TournamentStatus, string> = {
  [TournamentStatus.DRAFT]: 'Brouillon',
  [TournamentStatus.PUBLISHED]: 'Publié',
  [TournamentStatus.ARCHIVED]: 'Archivé',
} as const

/** Compact styles for tournament statuses (used in badges and admin UI). */
export const TOURNAMENT_STATUS_STYLES: Record<TournamentStatus, string> = {
  [TournamentStatus.DRAFT]: 'bg-amber-500/10 text-amber-400',
  [TournamentStatus.PUBLISHED]: 'bg-emerald-500/10 text-emerald-400',
  [TournamentStatus.ARCHIVED]: 'bg-zinc-500/10 text-zinc-400',
} as const

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
