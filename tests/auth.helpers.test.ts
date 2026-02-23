/**
 * File: tests/auth.helpers.test.ts
 * Description: Unit tests for the isAdmin authentication helper.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { describe, expect, it } from 'vitest'
import { isAdmin } from '@/lib/utils/auth.helpers'
import { Role } from '@/prisma/generated/prisma/enums'

// ---------------------------------------------------------------------------
// Tests
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
