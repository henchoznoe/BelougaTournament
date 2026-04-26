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

  it('PLAYER_DETAIL builds id-based path', () => {
    expect(ROUTES.PLAYER_DETAIL('user-123')).toBe('/players/user-123')
  })

  it('ADMIN_TOURNAMENT_DETAIL builds slug-based path', () => {
    expect(ROUTES.ADMIN_TOURNAMENT_DETAIL('my-tourney')).toBe(
      '/admin/tournaments/my-tourney',
    )
  })

  it('ADMIN_USER_DETAIL builds id-based path', () => {
    expect(ROUTES.ADMIN_USER_DETAIL('user-123')).toBe('/admin/users/user-123')
  })

  it('ADMIN_TOURNAMENT_EDIT builds edit path from slug', () => {
    expect(ROUTES.ADMIN_TOURNAMENT_EDIT('my-tourney')).toBe(
      '/admin/tournaments/my-tourney/edit',
    )
  })

  it('ADMIN_SPONSOR_NEW is /admin/sponsors/new', () => {
    expect(ROUTES.ADMIN_SPONSOR_NEW).toBe('/admin/sponsors/new')
  })

  it('ADMIN_SPONSOR_DETAIL builds id-based path', () => {
    expect(ROUTES.ADMIN_SPONSOR_DETAIL('sponsor-123')).toBe(
      '/admin/sponsors/sponsor-123',
    )
  })

  it('ADMIN_SPONSOR_EDIT builds id-based path', () => {
    expect(ROUTES.ADMIN_SPONSOR_EDIT('sponsor-123')).toBe(
      '/admin/sponsors/sponsor-123/edit',
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
  })

  it('maps configuration routes to ADMIN', () => {
    expect(ADMIN_ROUTE_ROLES[ROUTES.ADMIN_SETTINGS]).toBe(Role.ADMIN)
    expect(ADMIN_ROUTE_ROLES[ROUTES.ADMIN_SPONSORS]).toBe(Role.ADMIN)
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
