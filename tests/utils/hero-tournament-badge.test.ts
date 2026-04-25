/**
 * File: tests/utils/hero-tournament-badge.test.ts
 * Description: Unit tests for landing hero tournament badge helpers.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { describe, expect, it } from 'vitest'
import { DAY_IN_MS, MINUTE_IN_MS } from '@/lib/config/constants'
import {
  DEFAULT_HERO_TOURNAMENT_BADGE,
  getNextHeroTournamentBadgeUpdateDelay,
  resolveActiveTournamentSlug,
  resolveHeroTournamentBadge,
} from '@/lib/utils/hero-tournament-badge'

const UPCOMING_TOURNAMENT = {
  slug: 'tournoi-beta',
  title: 'Tournoi Beta',
  startDate: '2026-06-15T10:00:00.000Z',
  endDate: '2026-06-15T18:00:00.000Z',
}

const LIVE_TOURNAMENT = {
  slug: 'tournoi-live',
  title: 'Tournoi Live',
  startDate: '2026-06-15T10:00:00.000Z',
  endDate: '2026-06-15T18:00:00.000Z',
}

const LATER_TOURNAMENT = {
  slug: 'tournoi-gamma',
  title: 'Tournoi Gamma',
  startDate: '2026-06-18T10:00:00.000Z',
  endDate: '2026-06-18T18:00:00.000Z',
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

  it('returns a singular minute-only label when less than one minute remains', () => {
    const result = resolveHeroTournamentBadge(
      [UPCOMING_TOURNAMENT],
      new Date('2026-06-15T09:59:30.000Z'),
    )

    expect(result).toEqual({
      label: 'Tournoi Beta dans 1 minute',
      variant: 'upcoming',
    })
  })

  it('returns an exact hour label without minutes when aligned on the hour', () => {
    const result = resolveHeroTournamentBadge(
      [UPCOMING_TOURNAMENT],
      new Date('2026-06-15T08:00:00.000Z'),
    )

    expect(result).toEqual({
      label: 'Tournoi Beta dans 2 heures',
      variant: 'upcoming',
    })
  })

  it('returns a days label when the tournament is at least one day away', () => {
    const result = resolveHeroTournamentBadge(
      [UPCOMING_TOURNAMENT],
      new Date('2026-06-14T10:00:00.000Z'),
    )

    expect(result).toEqual({
      label: 'Tournoi Beta dans 1 jour',
      variant: 'upcoming',
    })
  })

  it('returns a plural days label when the tournament is multiple days away', () => {
    const result = resolveHeroTournamentBadge(
      [UPCOMING_TOURNAMENT],
      new Date('2026-06-13T10:00:00.000Z'),
    )

    expect(result).toEqual({
      label: 'Tournoi Beta dans 2 jours',
      variant: 'upcoming',
    })
  })

  it('returns a singular exact hour label when one hour remains', () => {
    const result = resolveHeroTournamentBadge(
      [UPCOMING_TOURNAMENT],
      new Date('2026-06-15T09:00:00.000Z'),
    )

    expect(result).toEqual({
      label: 'Tournoi Beta dans 1 heure',
      variant: 'upcoming',
    })
  })

  it('returns plural hours and singular minutes when both are present', () => {
    const result = resolveHeroTournamentBadge(
      [UPCOMING_TOURNAMENT],
      new Date('2026-06-15T07:59:00.000Z'),
    )

    expect(result).toEqual({
      label: 'Tournoi Beta dans 2 heures 1 minute',
      variant: 'upcoming',
    })
  })

  it('returns a live badge when a tournament is currently running', () => {
    const result = resolveHeroTournamentBadge(
      [LIVE_TOURNAMENT, LATER_TOURNAMENT],
      new Date('2026-06-15T12:00:00.000Z'),
    )

    expect(result).toEqual({
      label: 'Tournoi Live en cours',
      variant: 'live',
    })
  })

  it('uses the earliest upcoming tournament after sorting the input list', () => {
    const result = resolveHeroTournamentBadge(
      [LATER_TOURNAMENT, UPCOMING_TOURNAMENT],
      new Date('2026-06-15T08:47:00.000Z'),
    )

    expect(result).toEqual({
      label: 'Tournoi Beta dans 1 heure 13 minutes',
      variant: 'upcoming',
    })
  })

  it('returns the default badge when there is no live or upcoming tournament', () => {
    const result = resolveHeroTournamentBadge(
      [LIVE_TOURNAMENT],
      new Date('2026-06-16T12:00:00.000Z'),
    )

    expect(result).toEqual(DEFAULT_HERO_TOURNAMENT_BADGE)
  })
})

describe('resolveActiveTournamentSlug', () => {
  it('returns the slug of a live tournament', () => {
    const result = resolveActiveTournamentSlug(
      [LIVE_TOURNAMENT, LATER_TOURNAMENT],
      new Date('2026-06-15T12:00:00.000Z'),
    )

    expect(result).toBe('tournoi-live')
  })

  it('returns the slug of the earliest upcoming tournament when none is live', () => {
    const result = resolveActiveTournamentSlug(
      [LATER_TOURNAMENT, UPCOMING_TOURNAMENT],
      new Date('2026-06-15T08:00:00.000Z'),
    )

    expect(result).toBe('tournoi-beta')
  })

  it('returns null when no tournament is live or upcoming', () => {
    const result = resolveActiveTournamentSlug(
      [LIVE_TOURNAMENT],
      new Date('2026-06-16T12:00:00.000Z'),
    )

    expect(result).toBeNull()
  })

  it('prefers the live tournament over an upcoming one', () => {
    const result = resolveActiveTournamentSlug(
      [LIVE_TOURNAMENT, LATER_TOURNAMENT],
      new Date('2026-06-15T15:00:00.000Z'),
    )

    expect(result).toBe('tournoi-live')
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

  it('refreshes on the next full minute when an upcoming tournament starts on a minute boundary', () => {
    const result = getNextHeroTournamentBadgeUpdateDelay(
      [UPCOMING_TOURNAMENT],
      new Date('2026-06-15T09:59:00.000Z'),
    )

    expect(result).toBe(MINUTE_IN_MS)
  })

  it('refreshes after the remaining partial day for distant tournaments', () => {
    const result = getNextHeroTournamentBadgeUpdateDelay(
      [LATER_TOURNAMENT],
      new Date('2026-06-15T12:00:00.000Z'),
    )

    expect(result).toBe(22 * 60 * 60 * 1000)
  })

  it('refreshes after a full day when the distant tournament is exactly on a day boundary', () => {
    const result = getNextHeroTournamentBadgeUpdateDelay(
      [LATER_TOURNAMENT],
      new Date('2026-06-17T10:00:00.000Z'),
    )

    expect(result).toBe(DAY_IN_MS)
  })
})
