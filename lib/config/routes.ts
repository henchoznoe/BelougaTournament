/**
 * File: lib/config/routes.ts
 * Description: Global route definitions for the application.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

export const APP_ROUTES = {
  HOME: '/',
  ADMIN_DASHBOARD: '/admin',
  ADMIN_ADMINS: '/admin/admins',
  ADMIN_SETTINGS: '/admin/settings',
  ADMIN_TOURNAMENTS: '/admin/tournaments',
  ADMIN_NEW_TOURNAMENT: '/admin/tournaments/new',
  CONTACT: '/contact',
  LEGAL: '/legal',
  LOGIN: '/login',
  PRIVACY: '/privacy',
  RULES: '/rules',
  STREAM: '/stream',
  TERMS: '/terms',
  TOURNAMENTS: '/tournaments',
  TOURNAMENTS_ARCHIVE: '/tournaments/archive',
  UNAUTHORIZED: '/unauthorized',
} as const
