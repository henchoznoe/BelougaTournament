/**
 * File: tests/utils/public-tournament-order.test.ts
 * Description: Regression coverage for upcoming tournament visibility and chronological ordering.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { describe, expect, it } from 'vitest'
import {
  orderPublishedTournaments,
  selectUpcomingTournaments,
} from '@/lib/utils/public-tournament-order'

const now = new Date('2026-11-07T12:00:00Z')
const event = (id: string, start: string, end = start) => ({
  id,
  startDate: new Date(start),
  endDate: new Date(end),
})
const past = event('old', '2026-01-01T12:00:00Z')
const recent = event('recent', '2026-11-06T12:00:00Z')
const soon = event('in-two-days', '2026-11-09T12:00:00Z')
const later = event('later', '2026-12-01T12:00:00Z')
const current = event('current', '2026-11-07T10:00:00Z', '2026-11-07T14:00:00Z')

describe('public tournament ordering', () => {
  it('puts a newly created upcoming event before older published events and later events', () => {
    const rows = [past, later, recent, soon, current]
    expect(orderPublishedTournaments(rows, now).map(row => row.id)).toEqual([
      'current',
      'in-two-days',
      'later',
      'recent',
      'old',
    ])
    expect(rows).toEqual([past, later, recent, soon, current])
  })

  it('excludes finished events before taking the three landing cards', () => {
    expect(
      selectUpcomingTournaments([past, recent, later, soon, current], now)
        .slice(0, 3)
        .map(row => row.id),
    ).toEqual(['current', 'in-two-days', 'later'])
  })

  it('keeps a tournament until its end and then removes it from upcoming events', () => {
    const boundary = event(
      'ending-now',
      '2026-11-07T10:00:00Z',
      now.toISOString(),
    )
    expect(selectUpcomingTournaments([boundary], now)).toEqual([boundary])
    expect(
      selectUpcomingTournaments([boundary], new Date(now.getTime() + 1)),
    ).toEqual([])
  })

  it('supports empty lists and lists containing only finished events', () => {
    expect(orderPublishedTournaments([], now)).toEqual([])
    expect(selectUpcomingTournaments([past, recent], now)).toEqual([])
  })
})
