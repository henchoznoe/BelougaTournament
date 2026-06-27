/**
 * File: tests/utils/countdown.test.ts
 * Description: Unit tests for the countdown helpers.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { describe, expect, it } from 'vitest'
import { formatCountdownShort, getCountdownParts } from '@/lib/utils/countdown'

const NOW = new Date('2026-01-01T00:00:00.000Z')

describe('getCountdownParts', () => {
  it('breaks a future target into day/hour/minute parts', () => {
    const target = new Date('2026-01-04T05:30:00.000Z') // +3d 5h 30min
    const parts = getCountdownParts(target, NOW)

    expect(parts.days).toBe(3)
    expect(parts.hours).toBe(5)
    expect(parts.minutes).toBe(30)
    expect(parts.totalMs).toBeGreaterThan(0)
  })

  it('clamps day/hour/minute parts to zero for a past target', () => {
    const target = new Date('2025-12-31T00:00:00.000Z')
    const parts = getCountdownParts(target, NOW)

    expect(parts.days).toBe(0)
    expect(parts.hours).toBe(0)
    expect(parts.minutes).toBe(0)
    expect(parts.totalMs).toBeLessThan(0)
  })

  it('accepts string and number targets', () => {
    expect(getCountdownParts('2026-01-02T00:00:00.000Z', NOW).days).toBe(1)
    expect(getCountdownParts(NOW.getTime() + 3_600_000, NOW).hours).toBe(1)
  })
})

describe('formatCountdownShort', () => {
  it('formats days and hours when at least a day remains', () => {
    const target = new Date('2026-01-04T05:30:00.000Z')
    expect(formatCountdownShort(target, NOW)).toBe('3j 5h')
  })

  it('formats hours and minutes when less than a day remains', () => {
    const target = new Date('2026-01-01T05:12:00.000Z')
    expect(formatCountdownShort(target, NOW)).toBe('5h 12min')
  })

  it('formats minutes only when less than an hour remains', () => {
    const target = new Date('2026-01-01T00:08:00.000Z')
    expect(formatCountdownShort(target, NOW)).toBe('8min')
  })

  it('returns null when the target has already passed', () => {
    const target = new Date('2025-12-31T23:59:59.000Z')
    expect(formatCountdownShort(target, NOW)).toBeNull()
  })
})
