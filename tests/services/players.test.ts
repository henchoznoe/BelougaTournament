/**
 * File: tests/services/players.test.ts
 * Description: Unit tests for the players service.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock('server-only', () => ({}))
vi.mock('next/cache', () => ({ cacheLife: vi.fn(), cacheTag: vi.fn() }))
vi.mock('@/lib/core/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))

const mockFindMany = vi.fn()
vi.mock('@/lib/core/prisma', () => ({
  default: {
    user: { findMany: (...args: unknown[]) => mockFindMany(...args) },
  },
}))

// ---------------------------------------------------------------------------
// Module under test
// ---------------------------------------------------------------------------

const { getPlayers } = await import('@/lib/services/players')

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const MOCK_PLAYERS = [
  {
    id: 'user-1',
    name: 'PlayerOne',
    displayName: 'Player One',
    email: 'player1@example.com',
    image: null,
    discordId: 'discord-1',
    role: 'USER',
    createdAt: new Date('2026-01-01'),
    bannedUntil: null,
    banReason: null,
    _count: { registrations: 3 },
  },
  {
    id: 'user-2',
    name: 'PlayerTwo',
    displayName: 'Player Two',
    email: 'player2@example.com',
    image: 'https://cdn.discordapp.com/avatars/2/b.png',
    discordId: 'discord-2',
    role: 'USER',
    createdAt: new Date('2026-02-01'),
    bannedUntil: new Date('2030-01-01'),
    banReason: 'Toxicité',
    _count: { registrations: 0 },
  },
]

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('getPlayers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns the list of players', async () => {
    mockFindMany.mockResolvedValue(MOCK_PLAYERS)

    const result = await getPlayers()

    expect(result).toEqual(MOCK_PLAYERS)
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { role: 'USER' } }),
    )
  })

  it('returns an empty array when no players exist', async () => {
    mockFindMany.mockResolvedValue([])

    const result = await getPlayers()

    expect(result).toEqual([])
  })

  it('returns an empty array on database error', async () => {
    mockFindMany.mockRejectedValue(new Error('DB error'))

    const result = await getPlayers()

    expect(result).toEqual([])
  })
})
