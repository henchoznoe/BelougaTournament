/**
 * File: tests/utils/owner.test.ts
 * Description: Unit tests for the isOwner helper function.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

vi.mock('@/lib/core/env', () => ({
  env: {
    OWNER_EMAILS: ['owner1@test.com', 'owner2@test.com'],
  },
}))

const { isOwner } = await import('@/lib/utils/owner')

// ---------------------------------------------------------------------------
// isOwner
// ---------------------------------------------------------------------------

describe('isOwner', () => {
  it('returns true for the first owner email', () => {
    expect(isOwner('owner1@test.com')).toBe(true)
  })

  it('returns true for the second owner email', () => {
    expect(isOwner('owner2@test.com')).toBe(true)
  })

  it('returns false for a non-owner email', () => {
    expect(isOwner('random@test.com')).toBe(false)
  })

  it('returns false for an empty string', () => {
    expect(isOwner('')).toBe(false)
  })

  it('is case-sensitive (uppercase does not match)', () => {
    expect(isOwner('Owner1@test.com')).toBe(false)
  })
})
