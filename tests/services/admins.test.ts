/**
 * File: tests/services/admins.test.ts
 * Description: Unit tests for admin and tournament option services.
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

const mockUserFindMany = vi.fn()
const mockTournamentFindMany = vi.fn()
vi.mock('@/lib/core/prisma', () => ({
  default: {
    user: { findMany: (...args: unknown[]) => mockUserFindMany(...args) },
    tournament: {
      findMany: (...args: unknown[]) => mockTournamentFindMany(...args),
    },
  },
}))

// ---------------------------------------------------------------------------
// Module under test
// ---------------------------------------------------------------------------

const { getAdmins, getTournamentOptions, searchUsers } = await import(
  '@/lib/services/admins'
)

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const MOCK_ADMINS = [
  {
    id: 'admin-1',
    name: 'AdminUser',
    displayName: 'Admin User',
    email: 'admin@example.com',
    image: null,
    role: 'ADMIN',
    createdAt: new Date('2026-01-01'),
    adminOf: [],
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

const MOCK_USERS = [
  {
    id: 'user-1',
    name: 'PlayerOne',
    email: 'player1@example.com',
    image: null,
  },
]

// ---------------------------------------------------------------------------
// getAdmins
// ---------------------------------------------------------------------------

describe('getAdmins', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns the list of admin users', async () => {
    mockUserFindMany.mockResolvedValue(MOCK_ADMINS)

    const result = await getAdmins()

    expect(result).toEqual(MOCK_ADMINS)
    expect(mockUserFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { role: { in: ['ADMIN', 'SUPERADMIN'] } },
      }),
    )
  })

  it('returns an empty array on database error', async () => {
    mockUserFindMany.mockRejectedValue(new Error('DB error'))

    expect(await getAdmins()).toEqual([])
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

// ---------------------------------------------------------------------------
// searchUsers
// ---------------------------------------------------------------------------

describe('searchUsers', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns an empty array when query is empty', async () => {
    expect(await searchUsers('')).toEqual([])
    expect(mockUserFindMany).not.toHaveBeenCalled()
  })

  it('returns an empty array when query is a single character', async () => {
    expect(await searchUsers('a')).toEqual([])
    expect(mockUserFindMany).not.toHaveBeenCalled()
  })

  it('queries the database when the query is 2 or more characters', async () => {
    mockUserFindMany.mockResolvedValue(MOCK_USERS)

    const result = await searchUsers('pl')

    expect(result).toEqual(MOCK_USERS)
    expect(mockUserFindMany).toHaveBeenCalled()
  })

  it('returns an empty array on database error', async () => {
    mockUserFindMany.mockRejectedValue(new Error('DB error'))

    expect(await searchUsers('pl')).toEqual([])
  })
})
