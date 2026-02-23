/**
 * File: tests/auth.service.test.ts
 * Description: Unit tests for the auth service (getSession).
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'

// ---------------------------------------------------------------------------
// Mocks — must be defined before importing the module under test
// ---------------------------------------------------------------------------

const mockGetSession = vi.fn()
const mockHeaders = vi.fn().mockResolvedValue(new Headers())

vi.mock('@/lib/core/auth', () => ({
  default: {
    api: {
      getSession: (...args: unknown[]) => mockGetSession(...args),
    },
  },
}))

vi.mock('next/headers', () => ({
  headers: () => mockHeaders(),
}))

// ---------------------------------------------------------------------------
// Module under test
// ---------------------------------------------------------------------------

const { getSession } = await import('@/lib/services/auth.service')

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const MOCK_SESSION = {
  session: {
    id: 'session-1',
    userId: 'user-1',
    expiresAt: '2026-12-31T00:00:00Z',
    token: 'tok_abc',
  },
  user: {
    id: 'user-1',
    email: 'test@example.com',
    name: 'Test User',
    role: 'ADMIN',
    image: 'https://cdn.discordapp.com/avatars/123/abc.png',
    discordId: '123',
  },
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('getSession', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns a typed AuthSession when the user is authenticated', async () => {
    mockGetSession.mockResolvedValue(MOCK_SESSION)

    const result = await getSession()

    expect(result).toEqual(MOCK_SESSION)
    expect(result?.user.role).toBe('ADMIN')
    expect(result?.user.name).toBe('Test User')
  })

  it('returns null when no session exists', async () => {
    mockGetSession.mockResolvedValue(null)

    const result = await getSession()

    expect(result).toBeNull()
  })

  it('returns null when getSession returns undefined', async () => {
    mockGetSession.mockResolvedValue(undefined)

    const result = await getSession()

    expect(result).toBeNull()
  })
})
