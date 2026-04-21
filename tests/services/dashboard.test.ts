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
const mockSponsorCount = vi.fn()
const mockRegistrationFindMany = vi.fn()
const mockUserFindMany = vi.fn()
const mockPaymentFindMany = vi.fn()

vi.mock('@/lib/core/prisma', () => ({
  default: {
    tournament: {
      count: (...args: unknown[]) => mockTournamentCount(...args),
    },
    user: {
      count: (...args: unknown[]) => mockUserCount(...args),
      findMany: (...args: unknown[]) => mockUserFindMany(...args),
    },
    sponsor: {
      count: (...args: unknown[]) => mockSponsorCount(...args),
    },
    tournamentRegistration: {
      findMany: (...args: unknown[]) => mockRegistrationFindMany(...args),
    },
    payment: {
      findMany: (...args: unknown[]) => mockPaymentFindMany(...args),
    },
  },
}))

// ---------------------------------------------------------------------------
// Module under test
// ---------------------------------------------------------------------------

const {
  getDashboardStats,
  getRecentLogins,
  getRecentRegistrations,
  getDashboardPaymentStats,
} = await import('@/lib/services/dashboard')

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
      .mockResolvedValueOnce(2) // banned
    mockSponsorCount
      .mockResolvedValueOnce(6) // total sponsors
      .mockResolvedValueOnce(4) // enabled sponsors

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
        banned: 2,
      },
      sponsors: {
        total: 6,
        enabled: 4,
        disabled: 2,
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
        banned: 0,
      },
      sponsors: {
        total: 0,
        enabled: 0,
        disabled: 0,
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

// ---------------------------------------------------------------------------
// getDashboardPaymentStats
// ---------------------------------------------------------------------------

describe('getDashboardPaymentStats', () => {
  beforeEach(() => vi.clearAllMocks())

  const EMPTY_STATS = {
    totalRevenue: 0,
    totalRefunded: 0,
    totalStripeFees: 0,
    netRevenue: 0,
    transactionCount: 0,
    refundCount: 0,
    currency: 'CHF',
    byTournament: [],
  }

  it('returns empty stats when no payments exist', async () => {
    mockPaymentFindMany.mockResolvedValue([])

    expect(await getDashboardPaymentStats()).toEqual(EMPTY_STATS)
  })

  it('aggregates PAID payments correctly', async () => {
    mockPaymentFindMany.mockResolvedValue([
      {
        amount: 1000,
        currency: 'CHF',
        status: 'PAID',
        refundAmount: null,
        registration: {
          tournament: { id: 't1', title: 'Tournoi A', slug: 'tournoi-a' },
        },
      },
      {
        amount: 2000,
        currency: 'CHF',
        status: 'PAID',
        refundAmount: null,
        registration: {
          tournament: { id: 't1', title: 'Tournoi A', slug: 'tournoi-a' },
        },
      },
    ])

    const result = await getDashboardPaymentStats()

    expect(result.totalRevenue).toBe(3000)
    expect(result.totalRefunded).toBe(0)
    expect(result.netRevenue).toBe(3000)
    expect(result.transactionCount).toBe(2)
    expect(result.refundCount).toBe(0)
    expect(result.currency).toBe('CHF')
    expect(result.byTournament).toHaveLength(1)
    expect(result.byTournament[0].revenue).toBe(3000)
    expect(result.byTournament[0].paidCount).toBe(2)
  })

  it('handles REFUNDED payments (counts original amount as revenue + refund)', async () => {
    mockPaymentFindMany.mockResolvedValue([
      {
        amount: 1500,
        currency: 'CHF',
        status: 'REFUNDED',
        refundAmount: 1500,
        registration: {
          tournament: { id: 't1', title: 'Tournoi A', slug: 'tournoi-a' },
        },
      },
    ])

    const result = await getDashboardPaymentStats()

    expect(result.totalRevenue).toBe(1500)
    expect(result.totalRefunded).toBe(1500)
    expect(result.netRevenue).toBe(0)
    expect(result.transactionCount).toBe(1)
    expect(result.refundCount).toBe(1)
  })

  it('uses payment.amount as fallback when refundAmount is null', async () => {
    mockPaymentFindMany.mockResolvedValue([
      {
        amount: 2000,
        currency: 'CHF',
        status: 'REFUNDED',
        refundAmount: null,
        registration: {
          tournament: { id: 't1', title: 'Tournoi A', slug: 'tournoi-a' },
        },
      },
    ])

    const result = await getDashboardPaymentStats()

    expect(result.totalRefunded).toBe(2000)
    expect(result.netRevenue).toBe(0)
  })

  it('groups payments by tournament and sorts by revenue descending', async () => {
    mockPaymentFindMany.mockResolvedValue([
      {
        amount: 500,
        currency: 'CHF',
        status: 'PAID',
        refundAmount: null,
        registration: {
          tournament: { id: 't1', title: 'Small', slug: 'small' },
        },
      },
      {
        amount: 3000,
        currency: 'CHF',
        status: 'PAID',
        refundAmount: null,
        registration: {
          tournament: { id: 't2', title: 'Big', slug: 'big' },
        },
      },
    ])

    const result = await getDashboardPaymentStats()

    expect(result.byTournament).toHaveLength(2)
    expect(result.byTournament[0].id).toBe('t2')
    expect(result.byTournament[0].revenue).toBe(3000)
    expect(result.byTournament[1].id).toBe('t1')
    expect(result.byTournament[1].revenue).toBe(500)
  })

  it('mixes PAID and REFUNDED across tournaments', async () => {
    mockPaymentFindMany.mockResolvedValue([
      {
        amount: 1000,
        currency: 'EUR',
        status: 'PAID',
        refundAmount: null,
        registration: {
          tournament: { id: 't1', title: 'A', slug: 'a' },
        },
      },
      {
        amount: 1000,
        currency: 'EUR',
        status: 'REFUNDED',
        refundAmount: 800,
        registration: {
          tournament: { id: 't1', title: 'A', slug: 'a' },
        },
      },
    ])

    const result = await getDashboardPaymentStats()

    expect(result.totalRevenue).toBe(2000)
    expect(result.totalRefunded).toBe(800)
    expect(result.netRevenue).toBe(1200)
    expect(result.transactionCount).toBe(2)
    expect(result.refundCount).toBe(1)
    expect(result.currency).toBe('EUR')
    expect(result.byTournament[0].revenue).toBe(2000)
    expect(result.byTournament[0].refunded).toBe(800)
    expect(result.byTournament[0].paidCount).toBe(2)
    expect(result.byTournament[0].refundedCount).toBe(1)
  })

  it('returns empty stats on database error', async () => {
    mockPaymentFindMany.mockRejectedValue(new Error('DB error'))

    expect(await getDashboardPaymentStats()).toEqual(EMPTY_STATS)
  })
})
