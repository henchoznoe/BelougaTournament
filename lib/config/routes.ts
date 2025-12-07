/**
 * File: lib/config/routes.ts
 * Description: Global route definitions for the application.
 * Author: Noé Henchoz
 * Date: 2025-12-07
 * License: MIT
 */

// ----------------------------------------------------------------------
// CONSTANTS
// ----------------------------------------------------------------------

export const APP_ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  ADMIN_DASHBOARD: '/admin',
  ADMIN_TOURNAMENTS: '/admin/tournaments',
  ADMIN_SETTINGS: '/admin/settings',
  ADMIN_ADMINS: '/admin/admins',
  TOURNAMENTS: '/tournaments',
} as const
