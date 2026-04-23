/**
 * File: tests/utils/verify-admin.test.ts
 * Description: Unit tests for the verifyAdmin helper.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Role } from '@/prisma/generated/prisma/enums'

vi.mock('server-only', () => ({}))

const mockGetSession = vi.fn()
vi.mock('@/lib/core/auth', () => ({
  default: {
    api: { getSession: (...args: unknown[]) => mockGetSession(...args) },
  },
}))

const { verifyAdmin } = await import('@/lib/utils/verify-admin')

const makeRequest = () =>
  new Request('http://localhost:3000/admin', { method: 'GET' })

const ADMIN_SESSION = {
  user: { id: 'admin-1', role: Role.ADMIN },
  session: { id: 's1', userId: 'admin-1' },
}

const USER_SESSION = {
  user: { id: 'user-1', role: Role.USER },
  session: { id: 's2', userId: 'user-1' },
}

describe('verifyAdmin', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns the session when the request comes from an authenticated admin', async () => {
    mockGetSession.mockResolvedValue(ADMIN_SESSION)

    const result = await verifyAdmin(makeRequest())

    expect(result).toEqual(ADMIN_SESSION)
  })

  it('returns null when there is no active session', async () => {
    mockGetSession.mockResolvedValue(null)

    const result = await verifyAdmin(makeRequest())

    expect(result).toBeNull()
  })

  it('returns null when the session has no user', async () => {
    mockGetSession.mockResolvedValue({ session: { id: 's1' } })

    const result = await verifyAdmin(makeRequest())

    expect(result).toBeNull()
  })

  it('returns null when the authenticated user is not an admin', async () => {
    mockGetSession.mockResolvedValue(USER_SESSION)

    const result = await verifyAdmin(makeRequest())

    expect(result).toBeNull()
  })

  it('returns the session when the request comes from a super admin', async () => {
    const superAdminSession = {
      user: { id: 'sa-1', role: Role.SUPER_ADMIN },
      session: { id: 's3', userId: 'sa-1' },
    }
    mockGetSession.mockResolvedValue(superAdminSession)

    const result = await verifyAdmin(makeRequest())

    expect(result).toEqual(superAdminSession)
  })

  it('passes request headers to getSession', async () => {
    mockGetSession.mockResolvedValue(ADMIN_SESSION)
    const request = new Request('http://localhost:3000/admin', {
      headers: { cookie: 'session=abc123' },
    })

    await verifyAdmin(request)

    expect(mockGetSession).toHaveBeenCalledWith({ headers: request.headers })
  })
})
