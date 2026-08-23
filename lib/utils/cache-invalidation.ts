/**
 * File: lib/utils/cache-invalidation.ts
 * Description: Centralized cache invalidation groups for tournament and player mutations.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { updateTag } from 'next/cache'
import { CACHE_TAGS, CACHE_TAGS_DYNAMIC } from '@/lib/config/constants/cache'

const unique = (tags: string[]): string[] => [...new Set(tags)]

const getTournamentCatalogCacheTags = (options?: {
  tournamentId?: string
  slug?: string
}): string[] =>
  unique([
    CACHE_TAGS.TOURNAMENTS,
    CACHE_TAGS.TOURNAMENTS_PUBLISHED,
    CACHE_TAGS.TOURNAMENTS_ARCHIVED,
    CACHE_TAGS.TOURNAMENT_HERO,
    CACHE_TAGS.TOURNAMENTS_SITEMAP,
    CACHE_TAGS.PUBLIC_STATS,
    ...(options?.tournamentId
      ? [CACHE_TAGS_DYNAMIC.TOURNAMENT(options.tournamentId)]
      : []),
    ...(options?.slug
      ? [CACHE_TAGS_DYNAMIC.TOURNAMENT_SLUG(options.slug)]
      : []),
  ])

export const getTournamentParticipationCacheTags = (
  tournamentId: string,
  userIds: string | string[] = [],
): string[] => {
  const ids = Array.isArray(userIds) ? userIds : [userIds]
  return unique([
    CACHE_TAGS.TOURNAMENTS,
    CACHE_TAGS.TOURNAMENTS_PUBLISHED,
    CACHE_TAGS.PUBLIC_STATS,
    CACHE_TAGS_DYNAMIC.TOURNAMENT(tournamentId),
    CACHE_TAGS_DYNAMIC.TOURNAMENT_REGISTRANTS(tournamentId),
    CACHE_TAGS_DYNAMIC.TOURNAMENT_TEAMS(tournamentId),
    ...ids.map(CACHE_TAGS_DYNAMIC.USER_REGISTRATIONS),
  ])
}

const getPlayerCacheTags = (userId: string): string[] => [
  CACHE_TAGS.PLAYERS,
  CACHE_TAGS.PLAYERS_LIST,
  CACHE_TAGS_DYNAMIC.PLAYER(userId),
  CACHE_TAGS.PUBLIC_STATS,
]

const invalidate = (tags: string[]): void => {
  for (const tag of tags) updateTag(tag)
}

export const invalidateTournamentCatalog = (options?: {
  tournamentId?: string
  slug?: string
}): void => invalidate(getTournamentCatalogCacheTags(options))

export const invalidateTournamentParticipation = (
  tournamentId: string,
  userIds: string | string[] = [],
): void =>
  invalidate(getTournamentParticipationCacheTags(tournamentId, userIds))

export const invalidatePlayer = (userId: string): void =>
  invalidate(getPlayerCacheTags(userId))
