/**
 * File: tests/utils/cache-invalidation.test.ts
 * Description: Verifies cache dependency fan-out and mutation-context boundaries.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { CACHE_TAGS, CACHE_TAGS_DYNAMIC } from '@/lib/config/constants/cache'

vi.mock('server-only', () => ({}))
const mockUpdateTag = vi.fn()
const mockRevalidateTag = vi.fn()
const mockRevalidatePath = vi.fn()
const mockUsers = vi.fn()
const mockTournaments = vi.fn()
const mockError = vi.fn()
vi.mock('next/cache', () => ({
  updateTag: (...args: unknown[]) => mockUpdateTag(...args),
  revalidateTag: (...args: unknown[]) => mockRevalidateTag(...args),
  revalidatePath: (...args: unknown[]) => mockRevalidatePath(...args),
}))
vi.mock('@/lib/core/prisma', () => ({
  default: {
    user: { findMany: (...args: unknown[]) => mockUsers(...args) },
    tournament: { findMany: (...args: unknown[]) => mockTournaments(...args) },
  },
}))
vi.mock('@/lib/core/logger', () => ({
  logger: { error: (...args: unknown[]) => mockError(...args) },
}))

const {
  expireActionTags,
  expireRequestTags,
  getTournamentParticipantIds,
  getTournamentParticipationCacheTags,
  invalidatePlayer,
  invalidateTournamentCatalog,
  invalidateTournamentParticipation,
} = await import('@/lib/utils/cache-invalidation')
const calledTags = () => mockUpdateTag.mock.calls.map(([tag]) => tag)

describe('cache dependency invalidation', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    mockUsers.mockResolvedValue([])
    mockTournaments.mockResolvedValue([])
  })

  it('expires counters, archived catalogs, player history and the affected admin views', async () => {
    mockUsers.mockResolvedValue([{ id: 'teammate' }])
    await invalidateTournamentParticipation('t-1', 'captain')
    expect(calledTags()).toEqual(
      expect.arrayContaining([
        CACHE_TAGS.TOURNAMENTS_PUBLISHED,
        CACHE_TAGS.TOURNAMENTS_ARCHIVED,
        CACHE_TAGS.PLAYERS_LIST,
        CACHE_TAGS.PUBLIC_STATS,
        CACHE_TAGS.DASHBOARD_PAYMENTS,
        CACHE_TAGS_DYNAMIC.TOURNAMENT('t-1'),
        CACHE_TAGS_DYNAMIC.TOURNAMENT_TEAMS('t-1'),
        CACHE_TAGS_DYNAMIC.TOURNAMENT_REGISTRANTS('t-1'),
        CACHE_TAGS_DYNAMIC.USER_REGISTRATIONS('captain'),
        CACHE_TAGS_DYNAMIC.USER_REGISTRATIONS('teammate'),
        CACHE_TAGS_DYNAMIC.PLAYER('captain'),
        CACHE_TAGS_DYNAMIC.USER('teammate'),
      ]),
    )
    expect(calledTags()).not.toContain(
      CACHE_TAGS_DYNAMIC.TOURNAMENT('unrelated'),
    )
    expect(calledTags()).not.toContain(CACHE_TAGS.TOURNAMENTS_SITEMAP)
    expect(mockRevalidateTag).not.toHaveBeenCalled()
  })

  it('uses immediate request expiration and never calls updateTag in a route handler', async () => {
    mockUsers.mockResolvedValue([{ id: 'teammate' }])
    await invalidateTournamentParticipation('t-1', 'captain', expireRequestTags)
    expect(mockUpdateTag).not.toHaveBeenCalled()
    expect(mockRevalidateTag).toHaveBeenCalledWith(
      CACHE_TAGS_DYNAMIC.USER_REGISTRATIONS('teammate'),
      { expire: 0 },
    )
    for (const [, profile] of mockRevalidateTag.mock.calls)
      expect(profile).toEqual({ expire: 0 })
  })

  it('preserves captured user dependencies after a tournament deletion', async () => {
    await invalidateTournamentCatalog({
      tournamentId: 'deleted',
      slug: 'cup',
      userIds: ['former-player'],
    })
    expect(calledTags()).toEqual(
      expect.arrayContaining([
        CACHE_TAGS.TOURNAMENTS_SITEMAP,
        CACHE_TAGS.TOURNAMENT_HERO,
        CACHE_TAGS_DYNAMIC.TOURNAMENT_SLUG('cup'),
        CACHE_TAGS_DYNAMIC.USER_REGISTRATIONS('former-player'),
        CACHE_TAGS_DYNAMIC.PLAYER('former-player'),
      ]),
    )
    expect(mockRevalidatePath).toHaveBeenCalledWith('/tournaments/cup')
    expect(mockRevalidatePath).toHaveBeenCalledWith('/sitemap.xml')
  })

  it('refreshes embedded identity in team and participant reads, including archives', async () => {
    mockTournaments.mockResolvedValue([{ id: 'old-tournament' }])
    await invalidatePlayer('u-1')
    expect(calledTags()).toEqual(
      expect.arrayContaining([
        CACHE_TAGS.USERS,
        CACHE_TAGS.PLAYERS_LIST,
        CACHE_TAGS.DASHBOARD_RECENT_USERS,
        CACHE_TAGS_DYNAMIC.USER('u-1'),
        CACHE_TAGS_DYNAMIC.PLAYER('u-1'),
        CACHE_TAGS_DYNAMIC.TOURNAMENT_TEAMS('old-tournament'),
        CACHE_TAGS_DYNAMIC.TOURNAMENT_REGISTRANTS('old-tournament'),
      ]),
    )
    expect(calledTags()).not.toContain(CACHE_TAGS.SPONSORS)
  })

  it('captures current and former participants before destructive writes', async () => {
    mockUsers.mockResolvedValue([{ id: 'former' }, { id: 'member' }])
    expect(await getTournamentParticipantIds('t-1')).toEqual([
      'former',
      'member',
    ])
    expect(mockUsers).toHaveBeenCalledWith(
      expect.objectContaining({ select: { id: true } }),
    )
  })

  it('continues expiration after a cache error so a committed write remains successful', () => {
    mockUpdateTag.mockImplementationOnce(() => {
      throw new Error('cache unavailable')
    })
    expect(() => expireActionTags(['first', 'second', 'second'])).not.toThrow()
    expect(calledTags()).toEqual(['first', 'second'])
    expect(mockError).toHaveBeenCalledWith(
      { error: expect.any(Error), tag: 'first' },
      expect.any(String),
    )
  })

  it('expires known dependencies even when related-user lookup fails', async () => {
    mockUsers.mockRejectedValueOnce(new Error('lookup unavailable'))
    await invalidateTournamentParticipation('t-1', 'known')
    expect(calledTags()).toContain(
      CACHE_TAGS_DYNAMIC.USER_REGISTRATIONS('known'),
    )
    expect(mockError).toHaveBeenCalled()
  })

  it('deduplicates pure dependency resolution', () => {
    const tags = getTournamentParticipationCacheTags('t-1', ['u-1', 'u-1'])
    expect(new Set(tags).size).toBe(tags.length)
  })
})
