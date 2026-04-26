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

vi.mock('next/cache', () => ({ cacheLife: vi.fn(), cacheTag: vi.fn() }))
vi.mock('server-only', () => ({}))
vi.mock('@/lib/core/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))

const mockFindMany = vi.fn()
const mockFindUnique = vi.fn()
vi.mock('@/lib/core/prisma', () => ({
  default: {
    user: {
      findMany: (...args: unknown[]) => mockFindMany(...args),
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
    },
  },
}))

// ---------------------------------------------------------------------------
// Module under test
// ---------------------------------------------------------------------------

const { getPublicPlayers, getPlayerProfileStatus, getPublicPlayerProfile } =
  await import('@/lib/services/players')

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const MOCK_PLAYER_ROW = {
  id: 'user-1',
  displayName: 'TestPlayer',
  image: 'https://cdn.example.com/avatar.png',
  role: 'USER',
  createdAt: new Date('2025-06-01T00:00:00.000Z'),
  _count: { registrations: 3 },
}

const MOCK_PROFILE_ROW = {
  id: 'user-1',
  displayName: 'TestPlayer',
  image: 'https://cdn.example.com/avatar.png',
  role: 'USER',
  createdAt: new Date('2025-06-01T00:00:00.000Z'),
  registrations: [
    {
      tournament: {
        title: 'Tournoi Alpha',
        slug: 'tournoi-alpha',
        games: ['Valorant'],
        startDate: new Date('2025-07-01T00:00:00.000Z'),
        format: 'SOLO',
      },
    },
  ],
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks()
})

describe('getPublicPlayers', () => {
  it('returns mapped player list on success', async () => {
    mockFindMany.mockResolvedValue([MOCK_PLAYER_ROW])

    const result = await getPublicPlayers()

    expect(result).toEqual([
      {
        id: 'user-1',
        displayName: 'TestPlayer',
        image: 'https://cdn.example.com/avatar.png',
        role: 'USER',
        createdAt: MOCK_PLAYER_ROW.createdAt,
        tournamentCount: 3,
      },
    ])
  })

  it('returns empty array when no players found', async () => {
    mockFindMany.mockResolvedValue([])

    const result = await getPublicPlayers()

    expect(result).toEqual([])
  })

  it('returns empty array on error', async () => {
    mockFindMany.mockRejectedValue(new Error('DB error'))

    const result = await getPublicPlayers()

    expect(result).toEqual([])
  })
})

describe('getPlayerProfileStatus', () => {
  it('returns "public" when user exists with isPublic true and not banned', async () => {
    mockFindUnique.mockResolvedValue({ isPublic: true, bannedAt: null })

    const result = await getPlayerProfileStatus('user-1')

    expect(result).toBe('public')
  })

  it('returns "private" when user exists with isPublic false and not banned', async () => {
    mockFindUnique.mockResolvedValue({ isPublic: false, bannedAt: null })

    const result = await getPlayerProfileStatus('user-1')

    expect(result).toBe('private')
  })

  it('returns "not_found" when user does not exist', async () => {
    mockFindUnique.mockResolvedValue(null)

    const result = await getPlayerProfileStatus('nonexistent')

    expect(result).toBe('not_found')
  })

  it('returns "not_found" when user is banned', async () => {
    mockFindUnique.mockResolvedValue({
      isPublic: true,
      bannedAt: new Date('2025-01-01'),
    })

    const result = await getPlayerProfileStatus('banned-user')

    expect(result).toBe('not_found')
  })

  it('returns "not_found" on database error', async () => {
    mockFindUnique.mockRejectedValue(new Error('DB error'))

    const result = await getPlayerProfileStatus('user-1')

    expect(result).toBe('not_found')
  })
})

describe('getPublicPlayerProfile', () => {
  it('returns mapped profile when user is found', async () => {
    mockFindUnique.mockResolvedValue(MOCK_PROFILE_ROW)

    const result = await getPublicPlayerProfile('user-1')

    expect(result).toEqual({
      id: 'user-1',
      displayName: 'TestPlayer',
      image: 'https://cdn.example.com/avatar.png',
      role: 'USER',
      createdAt: MOCK_PROFILE_ROW.createdAt,
      tournamentHistory: [
        {
          tournamentTitle: 'Tournoi Alpha',
          tournamentSlug: 'tournoi-alpha',
          games: ['Valorant'],
          startDate: new Date('2025-07-01T00:00:00.000Z'),
          format: 'SOLO',
        },
      ],
    })
  })

  it('returns null when user is not found', async () => {
    mockFindUnique.mockResolvedValue(null)

    const result = await getPublicPlayerProfile('nonexistent')

    expect(result).toBeNull()
  })

  it('returns null on database error', async () => {
    mockFindUnique.mockRejectedValue(new Error('DB error'))

    const result = await getPublicPlayerProfile('user-1')

    expect(result).toBeNull()
  })
})
