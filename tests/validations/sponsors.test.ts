/**
 * File: tests/validations/sponsors.test.ts
 * Description: Unit tests for sponsor CRUD Zod validation schemas.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { describe, expect, it } from 'vitest'
import {
  deleteSponsorSchema,
  sponsorSchema,
  toggleSponsorStatusSchema,
  updateSponsorSchema,
} from '@/lib/validations/sponsors'

const VALID_UUID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
const INVALID_UUID = 'not-a-uuid'

const VALID_SPONSOR = {
  name: 'Belouga Corp',
  imageUrls: ['https://example.com/logo.png'],
  url: 'https://example.com',
  supportedSince: '2024-03-15',
}

// ---------------------------------------------------------------------------
// sponsorSchema
// ---------------------------------------------------------------------------

describe('sponsorSchema', () => {
  it('accepts a valid sponsor', () => {
    expect(sponsorSchema.safeParse(VALID_SPONSOR).success).toBe(true)
  })

  it('accepts an empty url (field cleared)', () => {
    const result = sponsorSchema.safeParse({ ...VALID_SPONSOR, url: '' })
    expect(result.success).toBe(true)
  })

  it('accepts multiple imageUrls', () => {
    const result = sponsorSchema.safeParse({
      ...VALID_SPONSOR,
      imageUrls: ['https://a.com/1.png', 'https://a.com/2.png'],
    })
    expect(result.success).toBe(true)
  })

  it('rejects an empty name', () => {
    expect(
      sponsorSchema.safeParse({ ...VALID_SPONSOR, name: '' }).success,
    ).toBe(false)
  })

  it('rejects a name exceeding 100 characters', () => {
    expect(
      sponsorSchema.safeParse({ ...VALID_SPONSOR, name: 'x'.repeat(101) })
        .success,
    ).toBe(false)
  })

  it('rejects empty imageUrls array', () => {
    expect(
      sponsorSchema.safeParse({ ...VALID_SPONSOR, imageUrls: [] }).success,
    ).toBe(false)
  })

  it('rejects an invalid image URL', () => {
    expect(
      sponsorSchema.safeParse({ ...VALID_SPONSOR, imageUrls: ['not-a-url'] })
        .success,
    ).toBe(false)
  })

  it('accepts a url that starts with http://', () => {
    expect(
      sponsorSchema.safeParse({ ...VALID_SPONSOR, url: 'http://example.com' })
        .success,
    ).toBe(true)
  })

  it('accepts a valid ISO date string', () => {
    expect(
      sponsorSchema.safeParse({
        ...VALID_SPONSOR,
        supportedSince: '2023-01-01',
      }).success,
    ).toBe(true)
  })

  it('rejects an invalid date string', () => {
    expect(
      sponsorSchema.safeParse({
        ...VALID_SPONSOR,
        supportedSince: 'not-a-date',
      }).success,
    ).toBe(false)
  })

  it('rejects a date in wrong format (dd.MM.yyyy)', () => {
    expect(
      sponsorSchema.safeParse({
        ...VALID_SPONSOR,
        supportedSince: '15.03.2024',
      }).success,
    ).toBe(false)
  })

  it('rejects a missing supportedSince', () => {
    const { supportedSince: _, ...withoutDate } = VALID_SPONSOR
    expect(sponsorSchema.safeParse(withoutDate).success).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// deleteSponsorSchema
// ---------------------------------------------------------------------------

describe('deleteSponsorSchema', () => {
  it('accepts a valid UUID', () => {
    expect(deleteSponsorSchema.safeParse({ id: VALID_UUID }).success).toBe(true)
  })

  it('rejects an invalid UUID', () => {
    expect(deleteSponsorSchema.safeParse({ id: INVALID_UUID }).success).toBe(
      false,
    )
  })

  it('rejects missing id', () => {
    expect(deleteSponsorSchema.safeParse({}).success).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// updateSponsorSchema
// ---------------------------------------------------------------------------

describe('updateSponsorSchema', () => {
  it('accepts a valid sponsor with id', () => {
    const result = updateSponsorSchema.safeParse({
      ...VALID_SPONSOR,
      id: VALID_UUID,
    })
    expect(result.success).toBe(true)
  })

  it('rejects missing id', () => {
    expect(updateSponsorSchema.safeParse(VALID_SPONSOR).success).toBe(false)
  })

  it('rejects invalid id UUID', () => {
    expect(
      updateSponsorSchema.safeParse({ ...VALID_SPONSOR, id: INVALID_UUID })
        .success,
    ).toBe(false)
  })

  it('inherits all sponsorSchema constraints', () => {
    expect(
      updateSponsorSchema.safeParse({
        id: VALID_UUID,
        ...VALID_SPONSOR,
        name: '',
      }).success,
    ).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// toggleSponsorStatusSchema
// ---------------------------------------------------------------------------

describe('toggleSponsorStatusSchema', () => {
  it('accepts a valid UUID', () => {
    expect(
      toggleSponsorStatusSchema.safeParse({ id: VALID_UUID }).success,
    ).toBe(true)
  })

  it('rejects an invalid UUID', () => {
    expect(
      toggleSponsorStatusSchema.safeParse({ id: INVALID_UUID }).success,
    ).toBe(false)
  })

  it('rejects missing id', () => {
    expect(toggleSponsorStatusSchema.safeParse({}).success).toBe(false)
  })
})
