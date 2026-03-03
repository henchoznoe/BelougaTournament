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
