/**
 * File: tests/config/routes.test.ts
 * Description: Unit tests for route definitions.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { describe, expect, it } from 'vitest'
import { ADMIN_ROUTE_ROLES, ROUTES } from '@/lib/config/routes'
import { Role } from '@/prisma/generated/prisma/enums'

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ROUTES', () => {
  it('HOME is /', () => {
    expect(ROUTES.HOME).toBe('/')
  })

  it('LOGIN is /login', () => {
    expect(ROUTES.LOGIN).toBe('/login')
  })

  it('ADMIN_DASHBOARD is /admin', () => {
    expect(ROUTES.ADMIN_DASHBOARD).toBe('/admin')
  })

  it('PROFILE_TOURNAMENTS is /profile/tournaments', () => {
    expect(ROUTES.PROFILE_TOURNAMENTS).toBe('/profile/tournaments')
  })

  it('ADMIN_TOURNAMENT_DETAIL builds slug-based path', () => {
    expect(ROUTES.ADMIN_TOURNAMENT_DETAIL('my-tourney')).toBe(
      '/admin/tournaments/my-tourney',
    )
  })

  it('ADMIN_TOURNAMENT_EDIT builds slug-based path', () => {
    expect(ROUTES.ADMIN_TOURNAMENT_EDIT('my-tourney')).toBe(
      '/admin/tournaments/my-tourney/edit',
    )
  })

  it('ADMIN_TOURNAMENT_REGISTRATIONS builds slug-based path', () => {
    expect(ROUTES.ADMIN_TOURNAMENT_REGISTRATIONS('cup-2026')).toBe(
      '/admin/tournaments/cup-2026/registrations',
    )
  })

  it('ADMIN_TOURNAMENT_TEAMS builds slug-based path', () => {
    expect(ROUTES.ADMIN_TOURNAMENT_TEAMS('cup-2026')).toBe(
      '/admin/tournaments/cup-2026/teams',
    )
  })

  it('API_TOURNAMENT_EXPORT_CSV builds id-based API path', () => {
    expect(ROUTES.API_TOURNAMENT_EXPORT_CSV('uuid-123')).toBe(
      '/api/admin/tournaments/uuid-123/export-csv',
    )
  })

  it('all static routes are non-empty strings starting with /', () => {
    const staticRoutes = Object.entries(ROUTES).filter(
      ([, value]) => typeof value === 'string',
    )
    for (const [, path] of staticRoutes) {
      expect(path).toMatch(/^\//)
    }
  })
})

// ---------------------------------------------------------------------------
// ADMIN_ROUTE_ROLES
// ---------------------------------------------------------------------------

describe('ADMIN_ROUTE_ROLES', () => {
  it('maps ADMIN-level routes correctly', () => {
    expect(ADMIN_ROUTE_ROLES[ROUTES.ADMIN_DASHBOARD]).toBe(Role.ADMIN)
    expect(ADMIN_ROUTE_ROLES[ROUTES.ADMIN_TOURNAMENTS]).toBe(Role.ADMIN)
    expect(ADMIN_ROUTE_ROLES[ROUTES.ADMIN_USERS]).toBe(Role.ADMIN)
    expect(ADMIN_ROUTE_ROLES[ROUTES.ADMIN_REGISTRATIONS]).toBe(Role.ADMIN)
  })

  it('maps SUPERADMIN-level routes correctly', () => {
    expect(ADMIN_ROUTE_ROLES[ROUTES.ADMIN_SETTINGS]).toBe(Role.SUPERADMIN)
    expect(ADMIN_ROUTE_ROLES[ROUTES.ADMIN_SPONSORS]).toBe(Role.SUPERADMIN)
  })

  it('every key is a valid admin route starting with /admin', () => {
    for (const path of Object.keys(ADMIN_ROUTE_ROLES)) {
      expect(path).toMatch(/^\/admin/)
    }
  })

  it('every value is a valid Role enum member', () => {
    const validRoles = new Set(Object.values(Role))
    for (const role of Object.values(ADMIN_ROUTE_ROLES)) {
      expect(validRoles.has(role)).toBe(true)
    }
  })
})
