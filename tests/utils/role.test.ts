/**
 * File: tests/utils/role.test.ts
 * Description: Unit tests for authentication helper functions.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { describe, expect, it } from 'vitest'
import {
  hasAdminAccess,
  isAdmin,
  isSuperAdmin,
  satisfiesRole,
} from '@/lib/utils/role'
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

describe('satisfiesRole', () => {
  // Full hierarchy matrix: [userRole, requiredRole, expected].
  // A higher-ranked role satisfies any lower-or-equal requirement.
  const cases: [Role, Role, boolean][] = [
    [Role.USER, Role.USER, true],
    [Role.USER, Role.ADMIN, false],
    [Role.USER, Role.SUPER_ADMIN, false],
    [Role.ADMIN, Role.USER, true],
    [Role.ADMIN, Role.ADMIN, true],
    [Role.ADMIN, Role.SUPER_ADMIN, false],
    [Role.SUPER_ADMIN, Role.USER, true],
    [Role.SUPER_ADMIN, Role.ADMIN, true],
    [Role.SUPER_ADMIN, Role.SUPER_ADMIN, true],
  ]

  it.each(
    cases,
  )('%s satisfying %s returns %s', (userRole, requiredRole, expected) => {
    expect(satisfiesRole(userRole, requiredRole)).toBe(expected)
  })
})
