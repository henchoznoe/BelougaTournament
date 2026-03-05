/**
 * File: tests/validations/players.test.ts
 * Description: Unit tests for player management Zod validation schemas.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { describe, expect, it } from 'vitest'
import {
  banPlayerSchema,
  unbanPlayerSchema,
  updatePlayerSchema,
} from '@/lib/validations/players'

const VALID_UUID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
const INVALID_UUID = 'not-a-uuid'

// ---------------------------------------------------------------------------
// banPlayerSchema
// ---------------------------------------------------------------------------

describe('banPlayerSchema', () => {
  it('accepts a valid UUID, future date, and ban reason', () => {
    const result = banPlayerSchema.safeParse({
      userId: VALID_UUID,
      bannedUntil: new Date(Date.now() + 1000 * 60 * 60 * 24),
      banReason: 'Comportement toxique',
    })
    expect(result.success).toBe(true)
  })

  it('accepts without optional banReason', () => {
    const result = banPlayerSchema.safeParse({
      userId: VALID_UUID,
      bannedUntil: new Date(Date.now() + 1000 * 60 * 60 * 24),
    })
    expect(result.success).toBe(true)
  })

  it('coerces an ISO date string to a Date', () => {
    const result = banPlayerSchema.safeParse({
      userId: VALID_UUID,
      bannedUntil: '2030-01-01T00:00:00.000Z',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.bannedUntil).toBeInstanceOf(Date)
    }
  })

  it('rejects an invalid date string', () => {
    const result = banPlayerSchema.safeParse({
      userId: VALID_UUID,
      bannedUntil: 'not-a-date',
    })
    expect(result.success).toBe(false)
  })

  it('rejects banReason exceeding 500 characters', () => {
    const result = banPlayerSchema.safeParse({
      userId: VALID_UUID,
      bannedUntil: new Date(Date.now() + 86400000),
      banReason: 'x'.repeat(501),
    })
    expect(result.success).toBe(false)
  })

  it('accepts banReason of exactly 500 characters', () => {
    const result = banPlayerSchema.safeParse({
      userId: VALID_UUID,
      bannedUntil: new Date(Date.now() + 86400000),
      banReason: 'x'.repeat(500),
    })
    expect(result.success).toBe(true)
  })

  it('rejects invalid userId', () => {
    const result = banPlayerSchema.safeParse({
      userId: INVALID_UUID,
      bannedUntil: new Date(Date.now() + 86400000),
    })
    expect(result.success).toBe(false)
  })

  it('rejects missing bannedUntil', () => {
    const result = banPlayerSchema.safeParse({ userId: VALID_UUID })
    expect(result.success).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// unbanPlayerSchema
// ---------------------------------------------------------------------------

describe('unbanPlayerSchema', () => {
  it('accepts a valid UUID', () => {
    expect(unbanPlayerSchema.safeParse({ userId: VALID_UUID }).success).toBe(
      true,
    )
  })

  it('rejects an invalid UUID', () => {
    expect(unbanPlayerSchema.safeParse({ userId: INVALID_UUID }).success).toBe(
      false,
    )
  })

  it('rejects missing userId', () => {
    expect(unbanPlayerSchema.safeParse({}).success).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// updatePlayerSchema
// ---------------------------------------------------------------------------

describe('updatePlayerSchema', () => {
  it('accepts a valid userId and displayName', () => {
    const result = updatePlayerSchema.safeParse({
      userId: VALID_UUID,
      displayName: 'PlayerXYZ',
    })
    expect(result.success).toBe(true)
  })

  it('accepts displayName of exactly 2 characters', () => {
    const result = updatePlayerSchema.safeParse({
      userId: VALID_UUID,
      displayName: 'AB',
    })
    expect(result.success).toBe(true)
  })

  it('accepts displayName of exactly 32 characters', () => {
    const result = updatePlayerSchema.safeParse({
      userId: VALID_UUID,
      displayName: 'A'.repeat(32),
    })
    expect(result.success).toBe(true)
  })

  it('rejects displayName shorter than 2 characters', () => {
    const result = updatePlayerSchema.safeParse({
      userId: VALID_UUID,
      displayName: 'A',
    })
    expect(result.success).toBe(false)
  })

  it('rejects displayName longer than 32 characters', () => {
    const result = updatePlayerSchema.safeParse({
      userId: VALID_UUID,
      displayName: 'A'.repeat(33),
    })
    expect(result.success).toBe(false)
  })

  it('trims whitespace before validation', () => {
    const result = updatePlayerSchema.safeParse({
      userId: VALID_UUID,
      displayName: '  A  ',
    })
    // After trim "A" has length 1 — should fail min(2)
    expect(result.success).toBe(false)
  })

  it('rejects an invalid userId', () => {
    const result = updatePlayerSchema.safeParse({
      userId: INVALID_UUID,
      displayName: 'PlayerXYZ',
    })
    expect(result.success).toBe(false)
  })

  it('rejects missing displayName', () => {
    const result = updatePlayerSchema.safeParse({ userId: VALID_UUID })
    expect(result.success).toBe(false)
  })

  it('rejects missing userId', () => {
    const result = updatePlayerSchema.safeParse({ displayName: 'PlayerXYZ' })
    expect(result.success).toBe(false)
  })
})
