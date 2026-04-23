/**
 * File: tests/utils/role.test.ts
 * Description: Unit tests for authentication helper functions.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { describe, expect, it } from 'vitest'
import { hasAdminAccess, isAdmin, isSuperAdmin } from '@/lib/utils/role'
import { Role } from '@/prisma/generated/prisma/enums'

describe('isSuperAdmin', () => {
  it('returns true for SUPER_ADMIN role', () => {
    expect(isSuperAdmin(Role.SUPER_ADMIN)).toBe(true)
  })

  it('returns false for ADMIN role', () => {
    expect(isSuperAdmin(Role.ADMIN)).toBe(false)
  })

  it('returns false for USER role', () => {
    expect(isSuperAdmin(Role.USER)).toBe(false)
  })
})

describe('hasAdminAccess', () => {
  it('returns true for ADMIN role', () => {
    expect(hasAdminAccess(Role.ADMIN)).toBe(true)
  })

  it('returns true for SUPER_ADMIN role', () => {
    expect(hasAdminAccess(Role.SUPER_ADMIN)).toBe(true)
  })

  it('returns false for USER role', () => {
    expect(hasAdminAccess(Role.USER)).toBe(false)
  })
})

describe('isAdmin', () => {
  it('returns true for ADMIN role', () => {
    expect(isAdmin(Role.ADMIN)).toBe(true)
  })

  it('returns true for SUPER_ADMIN role', () => {
    expect(isAdmin(Role.SUPER_ADMIN)).toBe(true)
  })

  it('returns false for USER role', () => {
    expect(isAdmin(Role.USER)).toBe(false)
  })
})
