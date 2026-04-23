/**
 * File: tests/utils/formatting.test.ts
 * Description: Unit tests for date formatting utilities.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { describe, expect, it } from 'vitest'
import {
  CENTIMES_PER_UNIT,
  STRIPE_FEE_FIXED_CENTIMES,
  STRIPE_FEE_PERCENT,
  STRIPE_FEE_PERCENT_DIVISOR,
} from '@/lib/config/constants'
import {
  calculateStripeNetAmount,
  formatCentimes,
  formatDate,
  formatDateTime,
  formatShortDate,
  fromNullable,
  parseCentimes,
  pluralize,
  stripHtml,
  toNullable,
} from '@/lib/utils/formatting'

const HTML_INPUT =
  '<p>Belouga&nbsp;<strong>Tournament</strong><br>Tom &amp; Jerry &#39;test&#39;</p>'
const STRIPPED_HTML_OUTPUT = "Belouga Tournament Tom & Jerry 'test'"
const AMOUNT_IN_CENTIMES = 1050
const AMOUNT_IN_UNITS = 10.55
const GROSS_STRIPE_AMOUNT_CENTIMES = 10000

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

describe('toNullable', () => {
  it('returns null for an empty string', () => {
    expect(toNullable('')).toBeNull()
  })

  it('returns null for undefined', () => {
    expect(toNullable(undefined)).toBeNull()
  })

  it('returns the value for a non-empty string', () => {
    expect(toNullable('hello')).toBe('hello')
  })

  it('returns the value for a whitespace-only string', () => {
    expect(toNullable(' ')).toBe(' ')
  })
})

describe('fromNullable', () => {
  it('returns empty string for null', () => {
    expect(fromNullable(null)).toBe('')
  })

  it('returns the value for a non-null string', () => {
    expect(fromNullable('hello')).toBe('hello')
  })

  it('returns empty string for empty string', () => {
    expect(fromNullable('')).toBe('')
  })
})

describe('stripHtml', () => {
  it('removes HTML tags, decodes entities, and collapses whitespace', () => {
    expect(stripHtml(HTML_INPUT)).toBe(STRIPPED_HTML_OUTPUT)
  })
})

describe('formatCentimes', () => {
  it('formats centimes with the default CHF currency', () => {
    expect(formatCentimes(AMOUNT_IN_CENTIMES)).toBe('10.50 CHF')
  })

  it('formats centimes with a custom uppercase currency code', () => {
    expect(formatCentimes(AMOUNT_IN_CENTIMES, 'eur')).toBe('10.50 EUR')
  })
})

describe('parseCentimes', () => {
  it('converts decimal units into rounded centimes', () => {
    expect(parseCentimes(AMOUNT_IN_UNITS)).toBe(1055)
  })
})

describe('pluralize', () => {
  it('returns an empty suffix for 0 and 1, then pluralizes above 1', () => {
    expect(pluralize(0)).toBe('')
    expect(pluralize(1)).toBe('')
    expect(pluralize(2)).toBe('s')
  })
})

describe('calculateStripeNetAmount', () => {
  it('deducts both percentage and fixed Stripe fees', () => {
    const expectedNetAmount = Math.round(
      GROSS_STRIPE_AMOUNT_CENTIMES -
        (STRIPE_FEE_PERCENT * GROSS_STRIPE_AMOUNT_CENTIMES) /
          STRIPE_FEE_PERCENT_DIVISOR -
        STRIPE_FEE_FIXED_CENTIMES,
    )

    expect(calculateStripeNetAmount(GROSS_STRIPE_AMOUNT_CENTIMES)).toBe(
      expectedNetAmount,
    )
  })

  it('keeps parse and format centimes helpers consistent', () => {
    const units = AMOUNT_IN_CENTIMES / CENTIMES_PER_UNIT

    expect(parseCentimes(units)).toBe(AMOUNT_IN_CENTIMES)
    expect(formatCentimes(parseCentimes(units))).toBe('10.50 CHF')
  })
})
