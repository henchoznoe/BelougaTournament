/**
 * File: lib/config/constants/cache.ts
 * Description: Cache tag names used with cacheTag() and revalidateTag().
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

/** Centralized cache tag names used with cacheTag() and revalidateTag(). */
export const CACHE_TAGS = {
  DASHBOARD_STATS: 'dashboard-stats',
  DASHBOARD_PAYMENTS: 'dashboard-payments',
  DASHBOARD_REGISTRATIONS: 'dashboard-registrations',
  DASHBOARD_RECENT_USERS: 'dashboard-recent-users',
  SETTINGS: 'settings',
  SPONSORS: 'sponsors',
  PUBLIC_STATS: 'public-stats',
  TOURNAMENTS_PUBLISHED: 'tournaments-published',
  TOURNAMENTS_ARCHIVED: 'tournaments-archived',
  TOURNAMENT_HERO: 'tournament-hero',
  TOURNAMENTS_SITEMAP: 'tournaments-sitemap',
  TOURNAMENTS: 'tournaments',
  USERS: 'users',
  PLAYERS: 'players',
  PLAYERS_LIST: 'players-list',
} as const

/** Parameterized tags used to invalidate only the entity that changed. */
export const CACHE_TAGS_DYNAMIC = {
  PLAYER: (userId: string) => `player:${userId}`,
  TOURNAMENT: (tournamentId: string) => `tournament:${tournamentId}`,
  TOURNAMENT_SLUG: (slug: string) => `tournament-slug:${slug}`,
  TOURNAMENT_REGISTRANTS: (tournamentId: string) =>
    `tournament:${tournamentId}:registrants`,
  TOURNAMENT_TEAMS: (tournamentId: string) =>
    `tournament:${tournamentId}:teams`,
  USER_REGISTRATIONS: (userId: string) => `user:${userId}:registrations`,
} as const
