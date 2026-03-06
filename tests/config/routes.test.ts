/**
 * File: tests/config/routes.test.ts
 * Description: Unit tests for route definitions.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { describe, expect, it } from 'vitest'
import { ROUTES } from '@/lib/config/routes'

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

  it('PROFILE_TOURNAMENTS is /profil/tournois', () => {
    expect(ROUTES.PROFILE_TOURNAMENTS).toBe('/profil/tournois')
  })

  it('ADMIN_EDIT_TOURNAMENT builds slug-based path', () => {
    expect(ROUTES.ADMIN_EDIT_TOURNAMENT('my-tourney')).toBe(
      '/admin/tournaments/my-tourney',
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
