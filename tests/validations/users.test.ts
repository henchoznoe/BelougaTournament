/**
 * File: tests/validations/users.test.ts
 * Description: Unit tests for unified user management Zod validation schemas.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { describe, expect, it } from 'vitest'
import {
  deleteUserSchema,
  demoteUserSchema,
  promoteUserSchema,
  updateUserSchema,
} from '@/lib/validations/users'

const VALID_UUID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
const INVALID_UUID = 'not-a-uuid'

// ---------------------------------------------------------------------------
// promoteUserSchema
// ---------------------------------------------------------------------------

describe('promoteUserSchema', () => {
  it('accepts a valid UUID', () => {
    expect(promoteUserSchema.safeParse({ userId: VALID_UUID }).success).toBe(
      true,
    )
  })

  it('rejects an invalid UUID', () => {
    expect(promoteUserSchema.safeParse({ userId: INVALID_UUID }).success).toBe(
      false,
    )
  })

  it('rejects missing userId', () => {
    expect(promoteUserSchema.safeParse({}).success).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// demoteUserSchema
// ---------------------------------------------------------------------------

describe('demoteUserSchema', () => {
  it('accepts a valid UUID', () => {
    expect(demoteUserSchema.safeParse({ userId: VALID_UUID }).success).toBe(
      true,
    )
  })

  it('rejects an invalid UUID', () => {
    expect(demoteUserSchema.safeParse({ userId: INVALID_UUID }).success).toBe(
      false,
    )
  })

  it('rejects missing userId', () => {
    expect(demoteUserSchema.safeParse({}).success).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// updateUserSchema
// ---------------------------------------------------------------------------

describe('updateUserSchema', () => {
  it('accepts valid userId and displayName', () => {
    const result = updateUserSchema.safeParse({
      userId: VALID_UUID,
      displayName: 'PlayerXYZ',
    })
    expect(result.success).toBe(true)
  })

  it('accepts displayName of exactly 2 characters', () => {
    const result = updateUserSchema.safeParse({
      userId: VALID_UUID,
      displayName: 'AB',
    })
    expect(result.success).toBe(true)
  })

  it('accepts displayName of exactly 32 characters', () => {
    const result = updateUserSchema.safeParse({
      userId: VALID_UUID,
      displayName: 'A'.repeat(32),
    })
    expect(result.success).toBe(true)
  })

  it('rejects displayName shorter than 2 characters', () => {
    const result = updateUserSchema.safeParse({
      userId: VALID_UUID,
      displayName: 'A',
    })
    expect(result.success).toBe(false)
  })

  it('accepts an empty displayName to clear the field', () => {
    const result = updateUserSchema.safeParse({
      userId: VALID_UUID,
      displayName: '',
    })
    expect(result.success).toBe(true)
  })

  it('accepts a whitespace-only displayName as empty after trim', () => {
    const result = updateUserSchema.safeParse({
      userId: VALID_UUID,
      displayName: '   ',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.displayName).toBe('')
    }
  })

  it('rejects displayName longer than 32 characters', () => {
    const result = updateUserSchema.safeParse({
      userId: VALID_UUID,
      displayName: 'A'.repeat(33),
    })
    expect(result.success).toBe(false)
  })

  it('trims whitespace before validation', () => {
    const result = updateUserSchema.safeParse({
      userId: VALID_UUID,
      displayName: '  A  ',
    })
    // After trim "A" has length 1 — should fail min(2)
    expect(result.success).toBe(false)
  })

  it('trims whitespace on a 2-char displayName and accepts it', () => {
    const result = updateUserSchema.safeParse({
      userId: VALID_UUID,
      displayName: '  AB  ',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.displayName).toBe('AB')
    }
  })

  it('rejects an invalid userId', () => {
    const result = updateUserSchema.safeParse({
      userId: INVALID_UUID,
      displayName: 'AdminXYZ',
    })
    expect(result.success).toBe(false)
  })

  it('rejects missing displayName', () => {
    const result = updateUserSchema.safeParse({
      userId: VALID_UUID,
    })
    expect(result.success).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// deleteUserSchema
// ---------------------------------------------------------------------------

describe('deleteUserSchema', () => {
  it('accepts a valid UUID', () => {
    expect(deleteUserSchema.safeParse({ userId: VALID_UUID }).success).toBe(
      true,
    )
  })

  it('rejects an invalid UUID', () => {
    expect(deleteUserSchema.safeParse({ userId: INVALID_UUID }).success).toBe(
      false,
    )
  })

  it('rejects missing userId', () => {
    expect(deleteUserSchema.safeParse({}).success).toBe(false)
  })
})
