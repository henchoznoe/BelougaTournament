/**
 * File: tests/utils/auth.helpers.test.ts
 * Description: Unit tests for authentication helper functions.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { describe, expect, it } from 'vitest'
import { isAdmin, isBanned, isSuperAdmin } from '@/lib/utils/auth.helpers'
import { Role } from '@/prisma/generated/prisma/enums'

// ---------------------------------------------------------------------------
// isAdmin
// ---------------------------------------------------------------------------

describe('isAdmin', () => {
  it('returns true for ADMIN role', () => {
    expect(isAdmin(Role.ADMIN)).toBe(true)
  })

  it('returns true for SUPERADMIN role', () => {
    expect(isAdmin(Role.SUPERADMIN)).toBe(true)
  })

  it('returns false for USER role', () => {
    expect(isAdmin(Role.USER)).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// isSuperAdmin
// ---------------------------------------------------------------------------

describe('isSuperAdmin', () => {
  it('returns true for SUPERADMIN role', () => {
    expect(isSuperAdmin(Role.SUPERADMIN)).toBe(true)
  })

  it('returns false for ADMIN role', () => {
    expect(isSuperAdmin(Role.ADMIN)).toBe(false)
  })

  it('returns false for USER role', () => {
    expect(isSuperAdmin(Role.USER)).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// isBanned
// ---------------------------------------------------------------------------

describe('isBanned', () => {
  it('returns false when bannedUntil is null', () => {
    expect(isBanned(null)).toBe(false)
  })

  it('returns true when bannedUntil is a Date in the future', () => {
    const future = new Date(Date.now() + 1000 * 60 * 60 * 24)
    expect(isBanned(future)).toBe(true)
  })

  it('returns false when bannedUntil is a Date in the past', () => {
    const past = new Date(Date.now() - 1000 * 60 * 60 * 24)
    expect(isBanned(past)).toBe(false)
  })

  it('returns true when bannedUntil is an ISO string in the future', () => {
    const future = new Date(Date.now() + 1000 * 60 * 60).toISOString()
    expect(isBanned(future)).toBe(true)
  })

  it('returns false when bannedUntil is an ISO string in the past', () => {
    const past = new Date(Date.now() - 1000 * 60 * 60).toISOString()
    expect(isBanned(past)).toBe(false)
  })

  it('returns true for permanent ban sentinel date', () => {
    expect(isBanned('9999-12-31T23:59:59.999Z')).toBe(true)
  })
})
