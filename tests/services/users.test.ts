/**
 * File: tests/services/users.test.ts
 * Description: Unit tests for the users service.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock('server-only', () => ({}))
vi.mock('@/lib/core/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))

const mockFindUnique = vi.fn()
vi.mock('@/lib/core/prisma', () => ({
  default: {
    user: { findUnique: (...args: unknown[]) => mockFindUnique(...args) },
  },
}))

// ---------------------------------------------------------------------------
// Module under test
// ---------------------------------------------------------------------------

const { getUserProfile } = await import('@/lib/services/users')

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const MOCK_PROFILE = {
  name: 'TestPlayer',
  displayName: 'Test Player',
  email: 'test@example.com',
  image: 'https://cdn.discordapp.com/avatars/123/abc.png',
  role: 'USER',
  createdAt: new Date('2026-01-01T00:00:00Z'),
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('getUserProfile', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns the user profile when found', async () => {
    mockFindUnique.mockResolvedValue(MOCK_PROFILE)

    const result = await getUserProfile('user-1')

    expect(result).toEqual(MOCK_PROFILE)
    expect(mockFindUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'user-1' } }),
    )
  })

  it('returns null when user does not exist', async () => {
    mockFindUnique.mockResolvedValue(null)

    const result = await getUserProfile('non-existent-id')

    expect(result).toBeNull()
  })

  it('returns null on database error', async () => {
    mockFindUnique.mockRejectedValue(new Error('DB connection failed'))

    const result = await getUserProfile('user-1')

    expect(result).toBeNull()
  })
})
