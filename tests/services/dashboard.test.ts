/**
 * File: tests/services/dashboard.test.ts
 * Description: Unit tests for admin dashboard statistics services.
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

const mockTournamentCount = vi.fn()
const mockUserCount = vi.fn()
const mockRegistrationCount = vi.fn()
const mockSponsorCount = vi.fn()
const mockTournamentFindMany = vi.fn()
const mockRegistrationFindMany = vi.fn()

vi.mock('@/lib/core/prisma', () => ({
  default: {
    tournament: {
      count: (...args: unknown[]) => mockTournamentCount(...args),
      findMany: (...args: unknown[]) => mockTournamentFindMany(...args),
    },
    user: { count: (...args: unknown[]) => mockUserCount(...args) },
    tournamentRegistration: {
      count: (...args: unknown[]) => mockRegistrationCount(...args),
      findMany: (...args: unknown[]) => mockRegistrationFindMany(...args),
    },
    sponsor: { count: (...args: unknown[]) => mockSponsorCount(...args) },
  },
}))

// ---------------------------------------------------------------------------
// Module under test
// ---------------------------------------------------------------------------

const { getDashboardStats, getUpcomingTournaments, getRecentRegistrations } =
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
    mockUserCount.mockResolvedValue(42)
    mockRegistrationCount.mockResolvedValue(7)
    mockSponsorCount.mockResolvedValue(3)

    const result = await getDashboardStats()

    expect(result).toEqual({
      tournaments: {
        total: 10,
        byStatus: { DRAFT: 4, PUBLISHED: 5, ARCHIVED: 1 },
      },
      players: 42,
      totalRegistrations: 7,
      sponsors: 3,
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
      players: 0,
      totalRegistrations: 0,
      sponsors: 0,
    })
  })
})

// ---------------------------------------------------------------------------
// getUpcomingTournaments
// ---------------------------------------------------------------------------

describe('getUpcomingTournaments', () => {
  beforeEach(() => vi.clearAllMocks())

  const MOCK_TOURNAMENTS = [
    {
      id: 'tourn-1',
      title: 'Tournoi Alpha',
      slug: 'tournoi-alpha',
      game: 'Valorant',
      format: 'SINGLE_ELIMINATION',
      teamSize: 5,
      startDate: new Date('2026-04-01'),
      status: 'PUBLISHED',
      _count: { registrations: 8, teams: 2 },
    },
  ]

  it('returns upcoming published tournaments', async () => {
    mockTournamentFindMany.mockResolvedValue(MOCK_TOURNAMENTS)

    const result = await getUpcomingTournaments()

    expect(result).toEqual(MOCK_TOURNAMENTS)
    expect(mockTournamentFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: 'PUBLISHED' }),
      }),
    )
  })

  it('respects the limit parameter', async () => {
    mockTournamentFindMany.mockResolvedValue([])

    await getUpcomingTournaments(3)

    expect(mockTournamentFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 3 }),
    )
  })

  it('returns an empty array on database error', async () => {
    mockTournamentFindMany.mockRejectedValue(new Error('DB error'))

    expect(await getUpcomingTournaments()).toEqual([])
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
      tournament: { title: 'Tournoi Alpha', slug: 'tournoi-alpha' },
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
