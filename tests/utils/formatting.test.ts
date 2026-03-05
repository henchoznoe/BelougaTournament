/**
 * File: tests/utils/formatting.test.ts
 * Description: Unit tests for date formatting utilities.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { describe, expect, it } from 'vitest'
import {
  formatDate,
  formatDateTime,
  formatShortDate,
} from '@/lib/utils/formatting'

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('formatDate', () => {
  it('formats March 15 2026 as "15 mars 2026"', () => {
    expect(formatDate(new Date(2026, 2, 15))).toBe('15 mars 2026')
  })

  it('formats January 1 as "1 janvier"', () => {
    const result = formatDate(new Date(2026, 0, 1))
    expect(result).toContain('janvier')
    expect(result).toContain('2026')
  })

  it('formats June 21 as "juin"', () => {
    const result = formatDate(new Date(2026, 5, 21))
    expect(result).toContain('juin')
  })

  it('accepts a numeric timestamp', () => {
    const result = formatDate(new Date(2026, 2, 15).getTime())
    expect(result).toBe('15 mars 2026')
  })

  it('accepts a Date string with explicit time to avoid timezone drift', () => {
    const result = formatDate(new Date(2026, 11, 25))
    expect(result).toContain('décembre')
    expect(result).toContain('2026')
  })
})

describe('formatDateTime', () => {
  it('includes "à" as separator between date and time', () => {
    expect(formatDateTime(new Date(2026, 2, 15, 10, 0))).toContain(' à ')
  })

  it('contains the correct date portion', () => {
    const result = formatDateTime(new Date(2026, 2, 15, 14, 30))
    expect(result).toContain('15 mars 2026')
  })

  it('contains the correct time portion', () => {
    const result = formatDateTime(new Date(2026, 2, 15, 14, 30))
    expect(result).toContain('14:30')
  })

  it('formats December correctly', () => {
    const result = formatDateTime(new Date(2026, 11, 25, 18, 0))
    expect(result).toContain('décembre')
    expect(result).toContain('2026')
  })
})

describe('formatShortDate', () => {
  it('formats as dd.MM.yyyy', () => {
    expect(formatShortDate(new Date(2026, 2, 15))).toBe('15.03.2026')
  })

  it('zero-pads single-digit day and month', () => {
    expect(formatShortDate(new Date(2026, 0, 5))).toBe('05.01.2026')
  })

  it('accepts a numeric timestamp', () => {
    expect(formatShortDate(new Date(2026, 11, 25).getTime())).toBe('25.12.2026')
  })

  it('accepts a string date', () => {
    const result = formatShortDate('2026-06-21T10:00:00.000Z')
    expect(result).toMatch(/^\d{2}\.\d{2}\.\d{4}$/)
  })

  it('formats last day of year correctly', () => {
    expect(formatShortDate(new Date(2026, 11, 31))).toBe('31.12.2026')
  })
})
