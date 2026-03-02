/**
 * File: tests/validations/profile.test.ts
 * Description: Unit tests for the user profile Zod validation schema.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { describe, expect, it } from 'vitest'
import { profileSchema } from '@/lib/validations/profile'

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('profileSchema', () => {
  it('accepts a valid displayName', () => {
    expect(
      profileSchema.safeParse({ displayName: 'BelougaPlayer' }).success,
    ).toBe(true)
  })

  it('accepts a displayName of exactly 2 characters', () => {
    expect(profileSchema.safeParse({ displayName: 'AB' }).success).toBe(true)
  })

  it('accepts a displayName of exactly 32 characters', () => {
    expect(
      profileSchema.safeParse({ displayName: 'A'.repeat(32) }).success,
    ).toBe(true)
  })

  it('rejects a displayName shorter than 2 characters', () => {
    expect(profileSchema.safeParse({ displayName: 'A' }).success).toBe(false)
  })

  it('rejects a displayName longer than 32 characters', () => {
    expect(
      profileSchema.safeParse({ displayName: 'A'.repeat(33) }).success,
    ).toBe(false)
  })

  it('rejects an empty displayName', () => {
    expect(profileSchema.safeParse({ displayName: '' }).success).toBe(false)
  })

  it('trims leading and trailing whitespace before validation', () => {
    // '  AB  ' trims to 'AB' (2 chars) — should pass
    expect(profileSchema.safeParse({ displayName: '  AB  ' }).success).toBe(
      true,
    )
  })

  it('rejects a displayName that is only whitespace', () => {
    // '   ' trims to '' (0 chars) — should fail
    expect(profileSchema.safeParse({ displayName: '   ' }).success).toBe(false)
  })

  it('rejects missing displayName', () => {
    expect(profileSchema.safeParse({}).success).toBe(false)
  })
})
