/**
 * File: tests/proxy.test.ts
 * Description: Unit tests for the proxy edge guard logic.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { NextRequest, NextResponse } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { AuthSession } from '@/lib/types/auth'
import { Role } from '@/prisma/generated/prisma/enums'

const BASE_URL = 'http://localhost:3000'

// proxy.ts pins the BetterAuth session endpoint to a trusted base URL read
// from the environment. Set it before the module is imported inside tests so
// session fetching uses the expected origin.
process.env.BETTER_AUTH_URL = BASE_URL
process.env.NEXT_PUBLIC_APP_URL = BASE_URL

const makeRequest = (path = '/admin/tournaments') =>
  new NextRequest(new URL(path, BASE_URL))

const loadProxyModule = async () => import('@/proxy')

const mockSession = (session: AuthSession | null) => {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: session !== null,
      json: async () => session,
    }),
  )
}

describe('proxy — admin route guard', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.restoreAllMocks()
    process.env.BETTER_AUTH_URL = BASE_URL
    process.env.NEXT_PUBLIC_APP_URL = BASE_URL
  })

  it('redirects to /login when no session exists', async () => {
    mockSession(null)
    const { proxy } = await loadProxyModule()

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
    const { proxy } = await loadProxyModule()

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
    const { proxy } = await loadProxyModule()

    expect((await proxy(makeRequest())).status).toBe(200)
    expect((await proxy(makeRequest('/admin/sponsors'))).status).toBe(200)
    expect((await proxy(makeRequest('/admin/settings'))).status).toBe(200)
  })

  it('redirects to /login when fetch throws', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValue(new Error('Network error')),
    )
    const { proxy } = await loadProxyModule()

    const response = await proxy(makeRequest())

    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toBe(`${BASE_URL}/login`)
  })

  it('redirects to /login when the trusted session fetch returns a non-ok response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, json: async () => null }),
    )
    const { proxy } = await loadProxyModule()

    const response = await proxy(makeRequest())

    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toBe(`${BASE_URL}/login`)
  })

  it('redirects to /login without fetching when no trusted base URL is configured', async () => {
    delete process.env.BETTER_AUTH_URL
    delete process.env.NEXT_PUBLIC_APP_URL
    const fetchSpy = vi.fn()
    vi.stubGlobal('fetch', fetchSpy)
    const { proxy } = await loadProxyModule()

    const response = await proxy(makeRequest())

    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toBe(`${BASE_URL}/login`)
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('falls back to ADMIN for paths outside the configured prefixes', async () => {
    mockSession({
      session: {
        id: 's3',
        userId: 'u3',
        expiresAt: new Date().toISOString(),
        token: 'tok',
      },
      user: {
        id: 'u3',
        email: 'admin@test.com',
        name: 'Admin',
        role: Role.ADMIN,
      },
    })
    const { proxy } = await loadProxyModule()

    const response = await proxy(makeRequest('/backoffice'))

    expect(response.status).toBe(200)
  })

  it('uses a fallback allowlist when a route maps to an unknown privileged role', async () => {
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

    vi.doMock('@/lib/config/routes', () => ({
      ADMIN_ROUTE_ROLES: { '/admin/owners': 'OWNER' },
    }))

    const { proxy } = await loadProxyModule()

    const response = await proxy(makeRequest('/admin/owners'))

    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toBe(`${BASE_URL}/unauthorized`)

    vi.doUnmock('@/lib/config/routes')
  })
})
