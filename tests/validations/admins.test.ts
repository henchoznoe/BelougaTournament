/**
 * File: tests/validations/admins.test.ts
 * Description: Unit tests for admin management Zod validation schemas.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { describe, expect, it } from 'vitest'
import {
  demoteAdminSchema,
  promoteAdminSchema,
  updateAdminSchema,
  updateAssignmentsSchema,
} from '@/lib/validations/admins'

const VALID_UUID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
const INVALID_UUID = 'not-a-uuid'

// ---------------------------------------------------------------------------
// promoteAdminSchema
// ---------------------------------------------------------------------------

describe('promoteAdminSchema', () => {
  it('accepts a valid UUID', () => {
    expect(promoteAdminSchema.safeParse({ userId: VALID_UUID }).success).toBe(
      true,
    )
  })

  it('rejects an invalid UUID', () => {
    expect(promoteAdminSchema.safeParse({ userId: INVALID_UUID }).success).toBe(
      false,
    )
  })

  it('rejects missing userId', () => {
    expect(promoteAdminSchema.safeParse({}).success).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// demoteAdminSchema
// ---------------------------------------------------------------------------

describe('demoteAdminSchema', () => {
  it('accepts a valid UUID', () => {
    expect(demoteAdminSchema.safeParse({ userId: VALID_UUID }).success).toBe(
      true,
    )
  })

  it('rejects an invalid UUID', () => {
    expect(demoteAdminSchema.safeParse({ userId: INVALID_UUID }).success).toBe(
      false,
    )
  })

  it('rejects missing userId', () => {
    expect(demoteAdminSchema.safeParse({}).success).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// updateAssignmentsSchema
// ---------------------------------------------------------------------------

describe('updateAssignmentsSchema', () => {
  it('accepts a valid userId and empty tournamentIds array', () => {
    const result = updateAssignmentsSchema.safeParse({
      userId: VALID_UUID,
      tournamentIds: [],
    })
    expect(result.success).toBe(true)
  })

  it('accepts a valid userId with multiple tournament UUIDs', () => {
    const result = updateAssignmentsSchema.safeParse({
      userId: VALID_UUID,
      tournamentIds: [VALID_UUID, VALID_UUID],
    })
    expect(result.success).toBe(true)
  })

  it('rejects invalid tournament UUID in the array', () => {
    const result = updateAssignmentsSchema.safeParse({
      userId: VALID_UUID,
      tournamentIds: [INVALID_UUID],
    })
    expect(result.success).toBe(false)
  })

  it('rejects invalid userId', () => {
    const result = updateAssignmentsSchema.safeParse({
      userId: INVALID_UUID,
      tournamentIds: [],
    })
    expect(result.success).toBe(false)
  })

  it('rejects missing tournamentIds', () => {
    const result = updateAssignmentsSchema.safeParse({ userId: VALID_UUID })
    expect(result.success).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// updateAdminSchema
// ---------------------------------------------------------------------------

describe('updateAdminSchema', () => {
  it('accepts valid userId, displayName, and empty tournamentIds', () => {
    const result = updateAdminSchema.safeParse({
      userId: VALID_UUID,
      displayName: 'AdminXYZ',
      tournamentIds: [],
    })
    expect(result.success).toBe(true)
  })

  it('accepts valid userId, displayName, and multiple tournament UUIDs', () => {
    const result = updateAdminSchema.safeParse({
      userId: VALID_UUID,
      displayName: 'AdminXYZ',
      tournamentIds: [VALID_UUID, VALID_UUID],
    })
    expect(result.success).toBe(true)
  })

  it('accepts displayName of exactly 2 characters', () => {
    const result = updateAdminSchema.safeParse({
      userId: VALID_UUID,
      displayName: 'AB',
      tournamentIds: [],
    })
    expect(result.success).toBe(true)
  })

  it('accepts displayName of exactly 32 characters', () => {
    const result = updateAdminSchema.safeParse({
      userId: VALID_UUID,
      displayName: 'A'.repeat(32),
      tournamentIds: [],
    })
    expect(result.success).toBe(true)
  })

  it('rejects displayName shorter than 2 characters', () => {
    const result = updateAdminSchema.safeParse({
      userId: VALID_UUID,
      displayName: 'A',
      tournamentIds: [],
    })
    expect(result.success).toBe(false)
  })

  it('rejects displayName longer than 32 characters', () => {
    const result = updateAdminSchema.safeParse({
      userId: VALID_UUID,
      displayName: 'A'.repeat(33),
      tournamentIds: [],
    })
    expect(result.success).toBe(false)
  })

  it('rejects an invalid tournament UUID in the array', () => {
    const result = updateAdminSchema.safeParse({
      userId: VALID_UUID,
      displayName: 'AdminXYZ',
      tournamentIds: [INVALID_UUID],
    })
    expect(result.success).toBe(false)
  })

  it('rejects an invalid userId', () => {
    const result = updateAdminSchema.safeParse({
      userId: INVALID_UUID,
      displayName: 'AdminXYZ',
      tournamentIds: [],
    })
    expect(result.success).toBe(false)
  })

  it('rejects missing displayName', () => {
    const result = updateAdminSchema.safeParse({
      userId: VALID_UUID,
      tournamentIds: [],
    })
    expect(result.success).toBe(false)
  })

  it('rejects missing tournamentIds', () => {
    const result = updateAdminSchema.safeParse({
      userId: VALID_UUID,
      displayName: 'AdminXYZ',
    })
    expect(result.success).toBe(false)
  })
})
