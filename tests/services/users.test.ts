/**
 * File: tests/services/users.test.ts
 * Description: Unit tests for the unified users service.
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

const mockUserFindUnique = vi.fn()
const mockUserFindMany = vi.fn()
const mockTournamentFindMany = vi.fn()
vi.mock('@/lib/core/prisma', () => ({
  default: {
    user: {
      findUnique: (...args: unknown[]) => mockUserFindUnique(...args),
      findMany: (...args: unknown[]) => mockUserFindMany(...args),
    },
    tournament: {
      findMany: (...args: unknown[]) => mockTournamentFindMany(...args),
    },
  },
}))

// ---------------------------------------------------------------------------
// Module under test
// ---------------------------------------------------------------------------

const { getUserProfile, getUsers, getTournamentOptions } = await import(
  '@/lib/services/users'
)

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

const MOCK_USERS = [
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
    registrations: [
      {
        id: 'reg-1',
        createdAt: new Date('2026-01-15'),
        tournament: {
          title: 'Tournoi Alpha',
          format: 'SOLO',
          status: 'PUBLISHED',
        },
        team: null,
      },
      {
        id: 'reg-2',
        createdAt: new Date('2026-01-10'),
        tournament: { title: 'Tournoi Beta', format: 'TEAM', status: 'DRAFT' },
        team: { name: 'Les Loups' },
      },
      {
        id: 'reg-3',
        createdAt: new Date('2026-01-05'),
        tournament: {
          title: 'Tournoi Gamma',
          format: 'SOLO',
          status: 'ARCHIVED',
        },
        team: null,
      },
    ],
    adminOf: [],
  },
  {
    id: 'admin-1',
    name: 'AdminUser',
    displayName: 'Admin User',
    email: 'admin@example.com',
    image: null,
    discordId: 'discord-2',
    role: 'ADMIN',
    createdAt: new Date('2026-02-01'),
    bannedUntil: null,
    banReason: null,
    registrations: [],
    adminOf: [
      {
        id: 'assign-1',
        tournamentId: 'tourn-1',
        tournament: {
          id: 'tourn-1',
          title: 'Tournoi Alpha',
          slug: 'tournoi-alpha',
        },
      },
    ],
  },
]

const MOCK_TOURNAMENTS = [
  {
    id: 'tourn-1',
    title: 'Tournoi Alpha',
    slug: 'tournoi-alpha',
    status: 'PUBLISHED',
  },
  {
    id: 'tourn-2',
    title: 'Tournoi Beta',
    slug: 'tournoi-beta',
    status: 'DRAFT',
  },
]

// ---------------------------------------------------------------------------
// getUserProfile
// ---------------------------------------------------------------------------

describe('getUserProfile', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns the user profile when found', async () => {
    mockUserFindUnique.mockResolvedValue(MOCK_PROFILE)

    const result = await getUserProfile('user-1')

    expect(result).toEqual(MOCK_PROFILE)
    expect(mockUserFindUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'user-1' } }),
    )
  })

  it('returns null when user does not exist', async () => {
    mockUserFindUnique.mockResolvedValue(null)

    expect(await getUserProfile('non-existent-id')).toBeNull()
  })

  it('returns null on database error', async () => {
    mockUserFindUnique.mockRejectedValue(new Error('DB connection failed'))

    expect(await getUserProfile('user-1')).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// getUsers
// ---------------------------------------------------------------------------

describe('getUsers', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns the list of all users', async () => {
    mockUserFindMany.mockResolvedValue(MOCK_USERS)

    const result = await getUsers()

    expect(result).toEqual(MOCK_USERS)
  })

  it('returns an empty array when no users exist', async () => {
    mockUserFindMany.mockResolvedValue([])

    expect(await getUsers()).toEqual([])
  })

  it('returns an empty array on database error', async () => {
    mockUserFindMany.mockRejectedValue(new Error('DB error'))

    expect(await getUsers()).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// getTournamentOptions
// ---------------------------------------------------------------------------

describe('getTournamentOptions', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns the list of tournament options', async () => {
    mockTournamentFindMany.mockResolvedValue(MOCK_TOURNAMENTS)

    const result = await getTournamentOptions()

    expect(result).toEqual(MOCK_TOURNAMENTS)
  })

  it('returns an empty array on database error', async () => {
    mockTournamentFindMany.mockRejectedValue(new Error('DB error'))

    expect(await getTournamentOptions()).toEqual([])
  })
})
