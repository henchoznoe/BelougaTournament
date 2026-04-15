/**
 * File: tests/utils/hero-tournament-badge.test.ts
 * Description: Unit tests for landing hero tournament badge helpers.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { describe, expect, it } from 'vitest'
import {
  getNextHeroTournamentBadgeUpdateDelay,
  resolveHeroTournamentBadge,
} from '@/lib/utils/hero-tournament-badge'

const UPCOMING_TOURNAMENT = {
  title: 'Tournoi Beta',
  startDate: '2026-06-15T10:00:00.000Z',
  endDate: '2026-06-15T18:00:00.000Z',
}

describe('resolveHeroTournamentBadge', () => {
  it('returns a label with hours and minutes when both are relevant', () => {
    const result = resolveHeroTournamentBadge(
      [UPCOMING_TOURNAMENT],
      new Date('2026-06-15T08:47:00.000Z'),
    )

    expect(result).toEqual({
      label: 'Tournoi Beta dans 1 heure 13 minutes',
      variant: 'upcoming',
    })
  })

  it('returns a minute-only label during the last hour', () => {
    const result = resolveHeroTournamentBadge(
      [UPCOMING_TOURNAMENT],
      new Date('2026-06-15T09:48:00.000Z'),
    )

    expect(result).toEqual({
      label: 'Tournoi Beta dans 12 minutes',
      variant: 'upcoming',
    })
  })
})

describe('getNextHeroTournamentBadgeUpdateDelay', () => {
  it('refreshes on the next minute boundary for upcoming tournaments', () => {
    const result = getNextHeroTournamentBadgeUpdateDelay(
      [UPCOMING_TOURNAMENT],
      new Date('2026-06-15T09:48:30.000Z'),
    )

    expect(result).toBe(30000)
  })

  it('refreshes exactly when a live tournament ends', () => {
    const result = getNextHeroTournamentBadgeUpdateDelay(
      [UPCOMING_TOURNAMENT],
      new Date('2026-06-15T17:59:45.000Z'),
    )

    expect(result).toBe(15000)
  })

  it('returns null when there is no future badge change to watch', () => {
    const result = getNextHeroTournamentBadgeUpdateDelay(
      [UPCOMING_TOURNAMENT],
      new Date('2026-06-16T10:00:00.000Z'),
    )

    expect(result).toBeNull()
  })
})
