/**
 * File: tests/utils/tournament-helpers.test.ts
 * Description: Unit tests for validateFieldValues and isRefundEligible helpers.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

import {
  isRefundEligible,
  validateFieldValues,
} from '@/lib/utils/tournament-helpers'
import { RefundPolicyType } from '@/prisma/generated/prisma/enums'

// ---------------------------------------------------------------------------
// validateFieldValues
// ---------------------------------------------------------------------------

describe('validateFieldValues', () => {
  it('returns valid for empty fields array', () => {
    expect(validateFieldValues([], {})).toEqual({ valid: true })
  })

  it('returns valid when all required fields are present', () => {
    const fields = [
      { label: 'Pseudo', type: 'TEXT', required: true },
      { label: 'Rang', type: 'TEXT', required: false },
    ]
    expect(validateFieldValues(fields, { Pseudo: 'Alice' })).toEqual({
      valid: true,
    })
  })

  it('returns invalid when a required field is missing', () => {
    const fields = [{ label: 'Pseudo', type: 'TEXT', required: true }]
    const result = validateFieldValues(fields, {})
    expect(result.valid).toBe(false)
    if (!result.valid) {
      expect(result.message).toContain('Pseudo')
      expect(result.message).toContain('requis')
    }
  })

  it('returns invalid when a required field is empty string', () => {
    const fields = [{ label: 'Pseudo', type: 'TEXT', required: true }]
    const result = validateFieldValues(fields, { Pseudo: '' })
    expect(result.valid).toBe(false)
  })

  it('accepts optional fields when absent', () => {
    const fields = [{ label: 'Notes', type: 'TEXT', required: false }]
    expect(validateFieldValues(fields, {})).toEqual({ valid: true })
  })

  it('returns valid for a NUMBER field with a numeric value', () => {
    const fields = [{ label: 'ELO', type: 'NUMBER', required: true }]
    expect(validateFieldValues(fields, { ELO: 1500 })).toEqual({ valid: true })
  })

  it('returns invalid for a NUMBER field with a string value', () => {
    const fields = [{ label: 'ELO', type: 'NUMBER', required: true }]
    const result = validateFieldValues(fields, {
      ELO: 'abc' as unknown as number,
    })
    expect(result.valid).toBe(false)
    if (!result.valid) {
      expect(result.message).toContain('ELO')
      expect(result.message).toContain('nombre')
    }
  })

  it('returns invalid for a NUMBER field with NaN', () => {
    const fields = [{ label: 'ELO', type: 'NUMBER', required: true }]
    const result = validateFieldValues(fields, { ELO: Number.NaN })
    expect(result.valid).toBe(false)
  })

  it('skips NUMBER validation for empty optional fields', () => {
    const fields = [{ label: 'ELO', type: 'NUMBER', required: false }]
    expect(
      validateFieldValues(fields, { ELO: '' as unknown as number }),
    ).toEqual({
      valid: true,
    })
  })

  it('returns valid for zero as a NUMBER value', () => {
    const fields = [{ label: 'Score', type: 'NUMBER', required: true }]
    expect(validateFieldValues(fields, { Score: 0 })).toEqual({ valid: true })
  })

  it('validates multiple fields and stops at first error', () => {
    const fields = [
      { label: 'Pseudo', type: 'TEXT', required: true },
      { label: 'ELO', type: 'NUMBER', required: true },
    ]
    const result = validateFieldValues(fields, {})
    expect(result.valid).toBe(false)
    if (!result.valid) {
      expect(result.message).toContain('Pseudo')
    }
  })
})

// ---------------------------------------------------------------------------
// isRefundEligible
// ---------------------------------------------------------------------------

describe('isRefundEligible', () => {
  const startDate = new Date('2026-05-01T00:00:00Z')

  it('returns false for NONE refund policy', () => {
    expect(
      isRefundEligible(
        startDate,
        RefundPolicyType.NONE,
        null,
        new Date('2026-04-01'),
      ),
    ).toBe(false)
  })

  it('returns false for BEFORE_DEADLINE with null deadline days', () => {
    expect(
      isRefundEligible(
        startDate,
        RefundPolicyType.BEFORE_DEADLINE,
        null,
        new Date('2026-04-01'),
      ),
    ).toBe(false)
  })

  it('returns true when within deadline period', () => {
    // 30 days before start, deadline is 7 days
    expect(
      isRefundEligible(
        startDate,
        RefundPolicyType.BEFORE_DEADLINE,
        7,
        new Date('2026-04-01'),
      ),
    ).toBe(true)
  })

  it('returns false when past the deadline', () => {
    // 3 days before start, deadline is 7 days
    expect(
      isRefundEligible(
        startDate,
        RefundPolicyType.BEFORE_DEADLINE,
        7,
        new Date('2026-04-28'),
      ),
    ).toBe(false)
  })

  it('returns false when exactly at the deadline boundary (exclusive)', () => {
    // Exactly 7 days before start — deadline is exclusive so this is no
    // longer eligible (must be strictly more than 7 days before start).
    const exactDeadline = new Date(
      startDate.getTime() - 7 * 24 * 60 * 60 * 1000,
    )
    expect(
      isRefundEligible(
        startDate,
        RefundPolicyType.BEFORE_DEADLINE,
        7,
        exactDeadline,
      ),
    ).toBe(false)
  })

  it('returns true when 1ms before the deadline', () => {
    const justBefore = new Date(
      startDate.getTime() - 7 * 24 * 60 * 60 * 1000 - 1,
    )
    expect(
      isRefundEligible(
        startDate,
        RefundPolicyType.BEFORE_DEADLINE,
        7,
        justBefore,
      ),
    ).toBe(true)
  })

  it('returns false when 1ms past the deadline', () => {
    const justPast = new Date(startDate.getTime() - 7 * 24 * 60 * 60 * 1000 + 1)
    expect(
      isRefundEligible(
        startDate,
        RefundPolicyType.BEFORE_DEADLINE,
        7,
        justPast,
      ),
    ).toBe(false)
  })

  it('returns false for NONE policy even with deadline days set', () => {
    expect(
      isRefundEligible(
        startDate,
        RefundPolicyType.NONE,
        7,
        new Date('2026-04-01'),
      ),
    ).toBe(false)
  })

  it('returns true with 0 deadline days when now is before start', () => {
    expect(
      isRefundEligible(
        startDate,
        RefundPolicyType.BEFORE_DEADLINE,
        0,
        new Date('2026-04-30'),
      ),
    ).toBe(true)
  })
})
