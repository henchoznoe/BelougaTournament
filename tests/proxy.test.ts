/**
 * File: proxy.test.ts
 * Description: Unit tests for the proxy edge guard logic.
 *   Tests redirect behaviour based on session and role without hitting any real network.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { NextRequest, NextResponse } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { AuthSession } from '@/lib/types/auth'
import { Role } from '@/prisma/generated/prisma/enums'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const BASE_URL = 'http://localhost:3000'

/** Build a minimal NextRequest aimed at an admin path. */
const makeRequest = (path = '/admin/tournaments') =>
  new NextRequest(new URL(path, BASE_URL))

/** Stub global fetch to return the given session payload (or null body). */
const mockSession = (session: AuthSession | null) => {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: session !== null,
      json: async () => session,
    }),
  )
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('proxy — admin route guard', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('redirects to /login when no session exists', async () => {
    mockSession(null)
    const { proxy } = await import('@/proxy')

    const response = await proxy(makeRequest())

    expect(response).toBeInstanceOf(NextResponse)
    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toBe(`${BASE_URL}/login`)
  })

  it('redirects to /unauthorized when user has role USER', async () => {
    mockSession({
      session: {
        id: 's1',
        userId: 'u1',
        expiresAt: new Date().toISOString(),
        token: 'tok',
      },
      user: { id: 'u1', email: 'user@test.com', name: 'User', role: Role.USER },
    })
    const { proxy } = await import('@/proxy')

    const response = await proxy(makeRequest())

    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toBe(`${BASE_URL}/unauthorized`)
  })

  it('allows access when user has role ADMIN', async () => {
    mockSession({
      session: {
        id: 's2',
        userId: 'u2',
        expiresAt: new Date().toISOString(),
        token: 'tok',
      },
      user: {
        id: 'u2',
        email: 'admin@test.com',
        name: 'Admin',
        role: Role.ADMIN,
      },
    })
    const { proxy } = await import('@/proxy')

    const response = await proxy(makeRequest())

    expect(response.status).toBe(200)
  })

  it('allows access when user has role SUPERADMIN', async () => {
    mockSession({
      session: {
        id: 's3',
        userId: 'u3',
        expiresAt: new Date().toISOString(),
        token: 'tok',
      },
      user: {
        id: 'u3',
        email: 'superadmin@test.com',
        name: 'Super',
        role: Role.SUPERADMIN,
      },
    })
    const { proxy } = await import('@/proxy')

    const response = await proxy(makeRequest())

    expect(response.status).toBe(200)
  })

  it('redirects to /login when fetch throws', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValue(new Error('Network error')),
    )
    const { proxy } = await import('@/proxy')

    const response = await proxy(makeRequest())

    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toBe(`${BASE_URL}/login`)
  })

  it('redirects ADMIN to /unauthorized on superadmin-only route /admin/sponsors', async () => {
    mockSession({
      session: {
        id: 's4',
        userId: 'u4',
        expiresAt: new Date().toISOString(),
        token: 'tok',
      },
      user: {
        id: 'u4',
        email: 'admin@test.com',
        name: 'Admin',
        role: Role.ADMIN,
      },
    })
    const { proxy } = await import('@/proxy')

    const response = await proxy(makeRequest('/admin/sponsors'))

    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toBe(`${BASE_URL}/unauthorized`)
  })

  it('redirects ADMIN to /unauthorized on superadmin-only route /admin/settings', async () => {
    mockSession({
      session: {
        id: 's5',
        userId: 'u5',
        expiresAt: new Date().toISOString(),
        token: 'tok',
      },
      user: {
        id: 'u5',
        email: 'admin@test.com',
        name: 'Admin',
        role: Role.ADMIN,
      },
    })
    const { proxy } = await import('@/proxy')

    const response = await proxy(makeRequest('/admin/settings'))

    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toBe(`${BASE_URL}/unauthorized`)
  })

  it('redirects ADMIN to /unauthorized on superadmin-only route /admin/admins', async () => {
    mockSession({
      session: {
        id: 's6',
        userId: 'u6',
        expiresAt: new Date().toISOString(),
        token: 'tok',
      },
      user: {
        id: 'u6',
        email: 'admin@test.com',
        name: 'Admin',
        role: Role.ADMIN,
      },
    })
    const { proxy } = await import('@/proxy')

    const response = await proxy(makeRequest('/admin/admins'))

    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toBe(`${BASE_URL}/unauthorized`)
  })

  it('allows SUPERADMIN access to superadmin-only routes', async () => {
    mockSession({
      session: {
        id: 's7',
        userId: 'u7',
        expiresAt: new Date().toISOString(),
        token: 'tok',
      },
      user: {
        id: 'u7',
        email: 'superadmin@test.com',
        name: 'Super',
        role: Role.SUPERADMIN,
      },
    })
    const { proxy } = await import('@/proxy')

    for (const path of [
      '/admin/sponsors',
      '/admin/settings',
      '/admin/admins',
    ]) {
      const response = await proxy(makeRequest(path))
      expect(response.status).toBe(200)
    }
  })
})
