/**
 * File: lib/config/routes.ts
 * Description: Global route definitions for the application.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

export const ROUTES = {
  HOME: '/',
  STREAM: '/stream',
  TOURNAMENTS: '/tournaments',
  TOURNAMENTS_ARCHIVE: '/tournaments/archive',
  LEADERBOARD: '/classement',
  LEGAL: '/legal',
  PRIVACY: '/privacy',
  TERMS: '/terms',
  CONTACT: '/contact',
  PROFILE: '/profil',
  LOGIN: '/login',
  UNAUTHORIZED: '/unauthorized',
  ADMIN_DASHBOARD: '/admin',
  ADMIN_ADMINS: '/admin/admins',
  ADMIN_PLAYERS: '/admin/players',
  ADMIN_SETTINGS: '/admin/settings',
  ADMIN_TOURNAMENTS: '/admin/tournaments',
  ADMIN_NEW_TOURNAMENT: '/admin/tournaments/new',
  ADMIN_SPONSORS: '/admin/sponsors',
} as const
