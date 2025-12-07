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

export const EXTERNAL_LINKS = {
  DISCORD: 'https://discord.gg/belouga',
  TWITCH: 'https://twitch.tv/quentadoulive',
} as const

export const HOME_CONFIG = {
  META_TITLE: 'Belouga Tournament',
  META_DESCRIPTION: 'Les tournois Belouga créés par Quentadoulive.',
  HERO_BLUE_BADGE: 'La référence e-sport amateur',
  HERO_TITLE: 'BELOUGA',
  HERO_TITLE_GRADIENT: 'TOURNAMENT',
  HERO_DESCRIPTION:
    "Rejoignez la compétition ultime. Tournois, communauté et diffusion en direct pour les passionnés d'e-sport.",
  HERO_DESCRIPTION_HIGHLIGHT: 'Votre gloire commence ici.',
  HERO_PRIMARY_CTA_TEXT: 'Participer',
  HERO_SECONDARY_CTA_TEXT: 'En savoir plus',
}

export const CACHE_TAGS = {
  TOURNAMENTS: 'tournaments',
} as const
