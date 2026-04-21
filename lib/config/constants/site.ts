/**
 * File: lib/config/constants/site.ts
 * Description: Site identity, branding, legal, and third-party service constants.
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

export const DEFAULT_ASSETS = {
  LOGO: '/assets/logo-blue.png',
  BG_IMAGE: '/assets/wall.png',
} as const

export const AUTHOR = {
  URL: 'https://henchoznoe.ch',
  NAME: 'Noé Henchoz',
  EMAIL: 'henchoznoe@gmail.com',
} as const

/** Site owner (Quentin Rutscho) — used on legal pages as the editor and data controller. */
export const OWNER = {
  NAME: 'Quentin Rutscho',
  EMAIL: 'rutschoquentin@gmail.com',
} as const

/** Discord API endpoints and CDN patterns. */
export const DISCORD = {
  API_USER_URL: 'https://discord.com/api/users/@me',
  AVATAR_CDN_URL: (userId: string, avatarHash: string) =>
    `https://cdn.discordapp.com/avatars/${userId}/${avatarHash}.png`,
} as const

/** Default currency for tournament entry fees. Extend this if multi-currency support is added. */
export const DEFAULT_CURRENCY = 'CHF' as const

/** Suffix used to set date to noon UTC, avoiding timezone-induced day shifts. */
export const NOON_UTC_SUFFIX = 'T12:00:00.000Z'
