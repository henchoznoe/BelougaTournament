/**
 * File: lib/constants.ts
 * Description: Global constants for the application.
 * Author: Noé Henchoz
 * Date: 2025-12-07
 * License: MIT
 */

// ----------------------------------------------------------------------
// CONSTANTS
// ----------------------------------------------------------------------

export const APP_METADATA = {
  LOCALE: 'fr-FR',
  NAME: 'Belouga Tournament',
  DESCRIPTION: 'La référence des tournois amateurs e-sport.',
  TEMPLATE_TITLE: '%s | Belouga Tournament',
  DEFAULT_LOGO: '/assets/logo-blue.png',
  DEFAULT_BG_IMG: '/assets/wall.png',
  AUTHOR_URL: 'https://henchoznoe.ch',
  AUTHOR_NAME: 'Noé Henchoz',
} as const

export const FALLBACK_SOCIAL_LINKS = {
  DISCORD: 'https://discord.gg/qACSpXBfcw',
  TWITCH: 'https://www.twitch.tv/quentadoulive',
  TIKTOK: 'https://www.tiktok.com/@quentadou',
  YOUTUBE: 'https://www.youtube.com/@quentadou9064',
  INSTAGRAM: 'https://www.instagram.com/quentadou._',
} as const
