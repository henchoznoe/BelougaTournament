/**
 * File: lib/config/routes.ts
 * Description: Global route definitions and admin access-control configuration.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { Role } from '@/prisma/generated/prisma/enums'

export const ROUTES = {
  HOME: '/',
  STREAM: '/stream',
  TOURNAMENTS: '/tournaments',
  TOURNAMENTS_ARCHIVE: '/tournaments/archive',
  LEADERBOARD: '/leaderboard',
  LEGAL: '/legal',
  PRIVACY: '/privacy',
  TERMS: '/terms',
  CONTACT: '/contact',
  PROFILE: '/profile',
  PROFILE_TOURNAMENTS: '/profile/tournaments',
  LOGIN: '/login',
  UNAUTHORIZED: '/unauthorized',
  ADMIN_DASHBOARD: '/admin',
  ADMIN_ADMINS: '/admin/admins',
  ADMIN_PLAYERS: '/admin/players',
  ADMIN_SETTINGS: '/admin/settings',
  ADMIN_TOURNAMENTS: '/admin/tournaments',
  ADMIN_NEW_TOURNAMENT: '/admin/tournaments/new',
  ADMIN_EDIT_TOURNAMENT: (slug: string) =>
    `/admin/tournaments/${slug}` as const,
  ADMIN_TOURNAMENT_REGISTRATIONS: (slug: string) =>
    `/admin/tournaments/${slug}/registrations` as const,
  ADMIN_TOURNAMENT_TEAMS: (slug: string) =>
    `/admin/tournaments/${slug}/teams` as const,
  ADMIN_SPONSORS: '/admin/sponsors',
  API_TOURNAMENT_EXPORT_CSV: (id: string) =>
    `/api/admin/tournaments/${id}/export-csv` as const,
} as const

/**
 * Minimum role required for each admin route prefix.
 * The proxy and nav use this to enforce access control dynamically.
 * Sub-routes inherit the role of their longest matching prefix
 * (e.g. /admin/tournaments/new inherits from /admin/tournaments).
 */
export const ADMIN_ROUTE_ROLES = {
  [ROUTES.ADMIN_DASHBOARD]: Role.ADMIN,
  [ROUTES.ADMIN_TOURNAMENTS]: Role.ADMIN,
  [ROUTES.ADMIN_PLAYERS]: Role.ADMIN,
  [ROUTES.ADMIN_SETTINGS]: Role.SUPERADMIN,
  [ROUTES.ADMIN_SPONSORS]: Role.SUPERADMIN,
  [ROUTES.ADMIN_ADMINS]: Role.SUPERADMIN,
} as const
