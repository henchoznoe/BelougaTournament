/**
 * File: tests/services/dashboard.test.ts
 * Description: Unit tests for admin dashboard statistics services.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Role } from '@/prisma/generated/prisma/enums'

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock('server-only', () => ({}))
vi.mock('next/cache', () => ({ cacheLife: vi.fn(), cacheTag: vi.fn() }))
vi.mock('@/lib/core/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))

const mockTournamentCount = vi.fn()
const mockUserCount = vi.fn()
const mockRegistrationFindMany = vi.fn()
const mockUserFindMany = vi.fn()

vi.mock('@/lib/core/prisma', () => ({
  default: {
    tournament: {
      count: (...args: unknown[]) => mockTournamentCount(...args),
    },
    user: {
      count: (...args: unknown[]) => mockUserCount(...args),
      findMany: (...args: unknown[]) => mockUserFindMany(...args),
    },
    tournamentRegistration: {
      findMany: (...args: unknown[]) => mockRegistrationFindMany(...args),
    },
  },
}))

// ---------------------------------------------------------------------------
// Module under test
// ---------------------------------------------------------------------------

const { getDashboardStats, getRecentLogins, getRecentRegistrations } =
  await import('@/lib/services/dashboard')

// ---------------------------------------------------------------------------
// getDashboardStats
// ---------------------------------------------------------------------------

describe('getDashboardStats', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns aggregated stats from the database', async () => {
    mockTournamentCount
      .mockResolvedValueOnce(10) // total
      .mockResolvedValueOnce(4) // DRAFT
      .mockResolvedValueOnce(5) // PUBLISHED
      .mockResolvedValueOnce(1) // ARCHIVED
    mockUserCount
      .mockResolvedValueOnce(50) // total users
      .mockResolvedValueOnce(42) // players (role USER)
      .mockResolvedValueOnce(3) // admins

    const result = await getDashboardStats()

    expect(result).toEqual({
      tournaments: {
        total: 10,
        byStatus: { DRAFT: 4, PUBLISHED: 5, ARCHIVED: 1 },
      },
      users: {
        total: 50,
        players: 42,
        admins: 3,
      },
    })
  })

  it('returns zero stats on database error', async () => {
    mockTournamentCount.mockRejectedValue(new Error('DB error'))

    const result = await getDashboardStats()

    expect(result).toEqual({
      tournaments: {
        total: 0,
        byStatus: { DRAFT: 0, PUBLISHED: 0, ARCHIVED: 0 },
      },
      users: {
        total: 0,
        players: 0,
        admins: 0,
      },
    })
  })
})

// ---------------------------------------------------------------------------
// getRecentLogins
// ---------------------------------------------------------------------------

describe('getRecentLogins', () => {
  beforeEach(() => vi.clearAllMocks())

  const MOCK_LOGINS = [
    {
      id: 'user-1',
      name: 'PlayerOne',
      displayName: 'Player One',
      image: null,
      role: Role.USER,
      lastLoginAt: new Date('2026-04-15T10:00:00Z'),
    },
    {
      id: 'user-2',
      name: 'AdminUser',
      displayName: 'Admin User',
      image: 'https://cdn.discordapp.com/avatars/456/def.png',
      role: Role.ADMIN,
      lastLoginAt: new Date('2026-04-14T08:00:00Z'),
    },
  ]

  it('returns recent logins ordered by lastLoginAt desc', async () => {
    mockUserFindMany.mockResolvedValue(MOCK_LOGINS)

    const result = await getRecentLogins()

    expect(result).toEqual(MOCK_LOGINS)
    expect(mockUserFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { lastLoginAt: { not: null } },
        orderBy: { lastLoginAt: 'desc' },
      }),
    )
  })

  it('respects the limit parameter', async () => {
    mockUserFindMany.mockResolvedValue([])

    await getRecentLogins(3)

    expect(mockUserFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 3 }),
    )
  })

  it('returns an empty array on database error', async () => {
    mockUserFindMany.mockRejectedValue(new Error('DB error'))

    expect(await getRecentLogins()).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// getRecentRegistrations
// ---------------------------------------------------------------------------

describe('getRecentRegistrations', () => {
  beforeEach(() => vi.clearAllMocks())

  const MOCK_REGISTRATIONS = [
    {
      id: 'reg-1',
      createdAt: new Date('2026-03-01'),
      user: { name: 'PlayerOne', image: null },
      tournament: {
        id: 'tourn-1',
        title: 'Tournoi Alpha',
        slug: 'tournoi-alpha',
      },
      team: { name: 'Team Alpha' },
    },
  ]

  it('returns recent registrations', async () => {
    mockRegistrationFindMany.mockResolvedValue(MOCK_REGISTRATIONS)

    const result = await getRecentRegistrations()

    expect(result).toEqual(MOCK_REGISTRATIONS)
    expect(mockRegistrationFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { createdAt: 'desc' } }),
    )
  })

  it('respects the limit parameter', async () => {
    mockRegistrationFindMany.mockResolvedValue([])

    await getRecentRegistrations(3)

    expect(mockRegistrationFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 3 }),
    )
  })

  it('returns an empty array on database error', async () => {
    mockRegistrationFindMany.mockRejectedValue(new Error('DB error'))

    expect(await getRecentRegistrations()).toEqual([])
  })
})
