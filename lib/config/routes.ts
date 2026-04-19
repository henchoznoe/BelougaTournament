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
  LOGIN: '/login',
  UNAUTHORIZED: '/unauthorized',
  ADMIN_DASHBOARD: '/admin',
  ADMIN_USERS: '/admin/users',
  ADMIN_USER_DETAIL: (id: string) => `/admin/users/${id}` as const,
  ADMIN_SETTINGS: '/admin/settings',
  ADMIN_TOURNAMENTS: '/admin/tournaments',
  ADMIN_TOURNAMENT_NEW: '/admin/tournaments/new',
  ADMIN_TOURNAMENT_DETAIL: (slug: string) =>
    `/admin/tournaments/${slug}` as const,
  ADMIN_TOURNAMENT_EDIT: (slug: string) =>
    `/admin/tournaments/${slug}/edit` as const,
  ADMIN_SPONSORS: '/admin/sponsors',
  ADMIN_SPONSOR_NEW: '/admin/sponsors/new',
  ADMIN_SPONSOR_DETAIL: (id: string) => `/admin/sponsors/${id}` as const,
  ADMIN_SPONSOR_EDIT: (id: string) => `/admin/sponsors/${id}/edit` as const,
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
  [ROUTES.ADMIN_USERS]: Role.ADMIN,
  [ROUTES.ADMIN_SETTINGS]: Role.ADMIN,
  [ROUTES.ADMIN_SPONSORS]: Role.ADMIN,
} as const
