/**
 * File: tests/validations/registrations.test.ts
 * Description: Unit tests for admin registration management Zod validation schemas.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { describe, expect, it } from 'vitest'
import {
  adminUpdateRegistrationFieldsSchema,
  changeTeamSchema,
  deleteRegistrationSchema,
  promoteCaptainSchema,
  refundRegistrationSchema,
} from '@/lib/validations/registrations'

const VALID_UUID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
const VALID_UUID_2 = 'b1ffc299-9c0b-4ef8-bb6d-6bb9bd380a22'
const INVALID_UUID = 'not-a-uuid'

// ---------------------------------------------------------------------------
// deleteRegistrationSchema
// ---------------------------------------------------------------------------

describe('deleteRegistrationSchema', () => {
  it('accepts a valid UUID', () => {
    expect(
      deleteRegistrationSchema.safeParse({ registrationId: VALID_UUID })
        .success,
    ).toBe(true)
  })

  it('rejects an invalid UUID', () => {
    expect(
      deleteRegistrationSchema.safeParse({ registrationId: INVALID_UUID })
        .success,
    ).toBe(false)
  })

  it('rejects missing registrationId', () => {
    expect(deleteRegistrationSchema.safeParse({}).success).toBe(false)
  })

  it('rejects an empty string', () => {
    expect(
      deleteRegistrationSchema.safeParse({ registrationId: '' }).success,
    ).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// adminUpdateRegistrationFieldsSchema
// ---------------------------------------------------------------------------

describe('adminUpdateRegistrationFieldsSchema', () => {
  it('accepts valid registrationId and string field values', () => {
    const result = adminUpdateRegistrationFieldsSchema.safeParse({
      registrationId: VALID_UUID,
      fieldValues: { Pseudo: 'Alice', Rang: 'Gold' },
    })
    expect(result.success).toBe(true)
  })

  it('accepts valid registrationId and number field values', () => {
    const result = adminUpdateRegistrationFieldsSchema.safeParse({
      registrationId: VALID_UUID,
      fieldValues: { ELO: 1500, Rank: 3 },
    })
    expect(result.success).toBe(true)
  })

  it('accepts mixed string/number field values', () => {
    const result = adminUpdateRegistrationFieldsSchema.safeParse({
      registrationId: VALID_UUID,
      fieldValues: { Pseudo: 'Alice', ELO: 1500 },
    })
    expect(result.success).toBe(true)
  })

  it('accepts an empty fieldValues object', () => {
    const result = adminUpdateRegistrationFieldsSchema.safeParse({
      registrationId: VALID_UUID,
      fieldValues: {},
    })
    expect(result.success).toBe(true)
  })

  it('rejects invalid registrationId', () => {
    const result = adminUpdateRegistrationFieldsSchema.safeParse({
      registrationId: INVALID_UUID,
      fieldValues: { Pseudo: 'Alice' },
    })
    expect(result.success).toBe(false)
  })

  it('rejects missing fieldValues', () => {
    const result = adminUpdateRegistrationFieldsSchema.safeParse({
      registrationId: VALID_UUID,
    })
    expect(result.success).toBe(false)
  })

  it('rejects boolean field values', () => {
    const result = adminUpdateRegistrationFieldsSchema.safeParse({
      registrationId: VALID_UUID,
      fieldValues: { Active: true },
    })
    expect(result.success).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// changeTeamSchema
// ---------------------------------------------------------------------------

describe('changeTeamSchema', () => {
  it('accepts valid registrationId and targetTeamId', () => {
    const result = changeTeamSchema.safeParse({
      registrationId: VALID_UUID,
      targetTeamId: VALID_UUID_2,
    })
    expect(result.success).toBe(true)
  })

  it('rejects invalid registrationId', () => {
    const result = changeTeamSchema.safeParse({
      registrationId: INVALID_UUID,
      targetTeamId: VALID_UUID_2,
    })
    expect(result.success).toBe(false)
  })

  it('rejects invalid targetTeamId', () => {
    const result = changeTeamSchema.safeParse({
      registrationId: VALID_UUID,
      targetTeamId: INVALID_UUID,
    })
    expect(result.success).toBe(false)
  })

  it('rejects missing targetTeamId', () => {
    const result = changeTeamSchema.safeParse({
      registrationId: VALID_UUID,
    })
    expect(result.success).toBe(false)
  })

  it('rejects missing registrationId', () => {
    const result = changeTeamSchema.safeParse({
      targetTeamId: VALID_UUID_2,
    })
    expect(result.success).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// promoteCaptainSchema
// ---------------------------------------------------------------------------

describe('promoteCaptainSchema', () => {
  it('accepts valid teamId and userId', () => {
    const result = promoteCaptainSchema.safeParse({
      teamId: VALID_UUID,
      userId: VALID_UUID_2,
    })
    expect(result.success).toBe(true)
  })

  it('rejects invalid teamId', () => {
    const result = promoteCaptainSchema.safeParse({
      teamId: INVALID_UUID,
      userId: VALID_UUID_2,
    })
    expect(result.success).toBe(false)
  })

  it('rejects invalid userId', () => {
    const result = promoteCaptainSchema.safeParse({
      teamId: VALID_UUID,
      userId: INVALID_UUID,
    })
    expect(result.success).toBe(false)
  })

  it('rejects missing teamId', () => {
    const result = promoteCaptainSchema.safeParse({
      userId: VALID_UUID_2,
    })
    expect(result.success).toBe(false)
  })

  it('rejects missing userId', () => {
    const result = promoteCaptainSchema.safeParse({
      teamId: VALID_UUID,
    })
    expect(result.success).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// refundRegistrationSchema
// ---------------------------------------------------------------------------

describe('refundRegistrationSchema', () => {
  it('accepts a valid UUID', () => {
    expect(
      refundRegistrationSchema.safeParse({ registrationId: VALID_UUID })
        .success,
    ).toBe(true)
  })

  it('rejects an invalid UUID', () => {
    expect(
      refundRegistrationSchema.safeParse({ registrationId: INVALID_UUID })
        .success,
    ).toBe(false)
  })

  it('rejects missing registrationId', () => {
    expect(refundRegistrationSchema.safeParse({}).success).toBe(false)
  })

  it('rejects an empty string', () => {
    expect(
      refundRegistrationSchema.safeParse({ registrationId: '' }).success,
    ).toBe(false)
  })
})
