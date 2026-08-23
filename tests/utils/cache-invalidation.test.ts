/**
 * File: tests/utils/cache-invalidation.test.ts
 * Description: Unit tests for granular cache invalidation groups.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { CACHE_TAGS, CACHE_TAGS_DYNAMIC } from '@/lib/config/constants'

const mockUpdateTag = vi.fn()
vi.mock('next/cache', () => ({
  updateTag: (...args: unknown[]) => mockUpdateTag(...args),
}))

const {
  invalidatePlayer,
  invalidateTournamentCatalog,
  invalidateTournamentParticipation,
} = await import('@/lib/utils/cache-invalidation')

const calledTags = (): unknown[] => mockUpdateTag.mock.calls.map(([tag]) => tag)

describe('cache invalidation groups', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('invalidates tournament catalogs, hero, sitemap, detail and public stats', () => {
    invalidateTournamentCatalog({ tournamentId: 't-1', slug: 'summer-cup' })

    expect(calledTags()).toEqual([
      CACHE_TAGS.TOURNAMENTS,
      CACHE_TAGS.TOURNAMENTS_PUBLISHED,
      CACHE_TAGS.TOURNAMENTS_ARCHIVED,
      CACHE_TAGS.TOURNAMENT_HERO,
      CACHE_TAGS.TOURNAMENTS_SITEMAP,
      CACHE_TAGS.PUBLIC_STATS,
      CACHE_TAGS_DYNAMIC.TOURNAMENT('t-1'),
      CACHE_TAGS_DYNAMIC.TOURNAMENT_SLUG('summer-cup'),
    ])
  })

  it('keeps a registration mutation scoped to its tournament and user', () => {
    invalidateTournamentParticipation('t-1', 'u-1')

    expect(calledTags()).toEqual([
      CACHE_TAGS.TOURNAMENTS,
      CACHE_TAGS.TOURNAMENTS_PUBLISHED,
      CACHE_TAGS.PUBLIC_STATS,
      CACHE_TAGS_DYNAMIC.TOURNAMENT('t-1'),
      CACHE_TAGS_DYNAMIC.TOURNAMENT_REGISTRANTS('t-1'),
      CACHE_TAGS_DYNAMIC.TOURNAMENT_TEAMS('t-1'),
      CACHE_TAGS_DYNAMIC.USER_REGISTRATIONS('u-1'),
    ])
    expect(calledTags()).not.toContain(CACHE_TAGS.TOURNAMENTS_ARCHIVED)
    expect(calledTags()).not.toContain(CACHE_TAGS.TOURNAMENTS_SITEMAP)
    expect(calledTags()).not.toContain(CACHE_TAGS.PLAYERS_LIST)
  })

  it('invalidates only the player list, profile and public stats', () => {
    invalidatePlayer('u-1')

    expect(calledTags()).toEqual([
      CACHE_TAGS.PLAYERS,
      CACHE_TAGS.PLAYERS_LIST,
      CACHE_TAGS_DYNAMIC.PLAYER('u-1'),
      CACHE_TAGS.PUBLIC_STATS,
    ])
    expect(calledTags()).not.toContain(CACHE_TAGS.TOURNAMENTS_PUBLISHED)
    expect(calledTags()).not.toContain(CACHE_TAGS.SPONSORS)
  })
})
