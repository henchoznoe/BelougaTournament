/**
 * File: tests/utils/role.test.ts
 * Description: Unit tests for authentication helper functions.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { describe, expect, it } from 'vitest'
import { isAdmin } from '@/lib/utils/role'
import { Role } from '@/prisma/generated/prisma/enums'

describe('isAdmin', () => {
  it('returns true for ADMIN role', () => {
    expect(isAdmin(Role.ADMIN)).toBe(true)
  })

  it('returns false for USER role', () => {
    expect(isAdmin(Role.USER)).toBe(false)
  })
})
