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

/** Milliseconds to wait before assuming a Twitch channel is offline if no state event fires. */
export const TWITCH_FALLBACK_TIMEOUT_MS = 8000

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

/** Common time durations in milliseconds. */
export const SECOND_IN_MS = 1000
export const MINUTE_IN_MS = SECOND_IN_MS * 60
const HOUR_IN_MS = MINUTE_IN_MS * 60
export const DAY_IN_MS = HOUR_IN_MS * 24

/** Minutes in one hour, used for sub-day time formatting. */
export const MINUTES_PER_HOUR = 60

/** Number of characters to display for Toornament IDs in the admin UI. */
export const TOORNAMENT_ID_DISPLAY_LENGTH = 12

/** Stripe slot hold duration in minutes — how long a registration is reserved during Stripe Checkout. */
export const REGISTRATION_HOLD_MINUTES = 30

/** Maximum upload file sizes in bytes. */
export const MAX_ADMIN_UPLOAD_SIZE = 5 * 1024 * 1024 // 5 MB
export const MAX_TEAM_LOGO_SIZE = 2 * 1024 * 1024 // 2 MB

/** Number of centimes in one currency unit (e.g. 100 centimes = 1 CHF). */
export const CENTIMES_PER_UNIT = 100

/** Entry fee amount bounds in centimes. */
export const ENTRY_FEE_MIN_AMOUNT = 100 // 1 CHF
export const ENTRY_FEE_MAX_AMOUNT = 100_000 // 1000 CHF

/** Shared validation limits used in Zod schemas and component maxLength attributes. */
export const VALIDATION_LIMITS = {
  TEAM_NAME_MIN: 2,
  TEAM_NAME_MAX: 30,
  DISPLAY_NAME_MIN: 2,
  DISPLAY_NAME_MAX: 32,
  TITLE_MAX: 200,
  SLUG_MAX: 200,
  DESCRIPTION_MAX: 15_000,
  RULES_MAX: 30_000,
  PRIZE_MAX: 5_000,
  GAME_MAX: 100,
  FIELD_LABEL_MAX: 100,
  SPONSOR_NAME_MAX: 100,
  STAGE_NAME_MAX: 30,
  EXTERNAL_ID_MAX: 200,
  REFUND_DEADLINE_MIN_DAYS: 1,
  REFUND_DEADLINE_MAX_DAYS: 90,
  TEAM_SIZE_MIN: 1,
  TEAM_SIZE_MAX: 20,
  MAX_TEAMS_MIN: 2,
  RETURN_PATH_MAX: 500,
  SEARCH_QUERY_MAX: 100,
  FEATURE_TITLE_MAX: 50,
  FEATURE_DESCRIPTION_MAX: 200,
} as const
