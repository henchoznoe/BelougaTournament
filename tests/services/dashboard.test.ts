/**
 * File: tests/services/dashboard.test.ts
 * Description: Unit tests for admin dashboard statistics services.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  Role,
  TournamentFormat,
  TournamentStatus,
} from '@/prisma/generated/prisma/enums'

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
const mockUserFindMany = vi.fn()
const mockSponsorFindMany = vi.fn()

vi.mock('@/lib/core/prisma', () => ({
  default: {
    tournament: {
      count: (...args: unknown[]) => mockTournamentCount(...args),
      findMany: (...args: unknown[]) => mockTournamentFindMany(...args),
    },
    user: {
      count: (...args: unknown[]) => mockUserCount(...args),
      findMany: (...args: unknown[]) => mockUserFindMany(...args),
    },
    tournamentRegistration: {
      count: (...args: unknown[]) => mockRegistrationCount(...args),
      findMany: (...args: unknown[]) => mockRegistrationFindMany(...args),
    },
    sponsor: {
      count: (...args: unknown[]) => mockSponsorCount(...args),
      findMany: (...args: unknown[]) => mockSponsorFindMany(...args),
    },
  },
}))

// ---------------------------------------------------------------------------
// Module under test
// ---------------------------------------------------------------------------

const {
  getDashboardStats,
  getUpcomingTournaments,
  getRecentRegistrations,
  getRecentUsers,
  getRecentSponsors,
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
      .mockResolvedValueOnce(3) // admins (ADMIN + SUPERADMIN)
      .mockResolvedValueOnce(8) // ghosts (no registrations)
    mockRegistrationCount
      .mockResolvedValueOnce(7) // total registrations
      .mockResolvedValueOnce(4) // solo (teamId null)
      .mockResolvedValueOnce(3) // team (teamId not null)
    mockSponsorCount.mockResolvedValue(3)

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
        ghosts: 8,
      },
      registrations: {
        total: 7,
        solo: 4,
        team: 3,
      },
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
      users: {
        total: 0,
        players: 0,
        admins: 0,
        ghosts: 0,
      },
      registrations: {
        total: 0,
        solo: 0,
        team: 0,
      },
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
      format: TournamentFormat.SOLO,
      teamSize: 5,
      startDate: new Date('2026-04-01'),
      status: TournamentStatus.PUBLISHED,
      _count: { registrations: 8, teams: 2 },
    },
  ]

  it('returns upcoming published tournaments', async () => {
    mockTournamentFindMany.mockResolvedValue(MOCK_TOURNAMENTS)

    const result = await getUpcomingTournaments()

    expect(result).toEqual(MOCK_TOURNAMENTS)
    expect(mockTournamentFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: TournamentStatus.PUBLISHED }),
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
// getRecentUsers
// ---------------------------------------------------------------------------

describe('getRecentUsers', () => {
  beforeEach(() => vi.clearAllMocks())

  const MOCK_RECENT_USERS = [
    {
      id: 'user-1',
      name: 'PlayerOne',
      displayName: 'Player One',
      image: null,
      role: Role.USER,
      createdAt: new Date('2026-03-10'),
    },
    {
      id: 'user-2',
      name: 'AdminUser',
      displayName: 'Admin User',
      image: 'https://cdn.discordapp.com/avatars/456/def.png',
      role: Role.ADMIN,
      createdAt: new Date('2026-03-08'),
    },
  ]

  it('returns recent users', async () => {
    mockUserFindMany.mockResolvedValue(MOCK_RECENT_USERS)

    const result = await getRecentUsers()

    expect(result).toEqual(MOCK_RECENT_USERS)
    expect(mockUserFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { createdAt: 'desc' } }),
    )
  })

  it('respects the limit parameter', async () => {
    mockUserFindMany.mockResolvedValue([])

    await getRecentUsers(3)

    expect(mockUserFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 3 }),
    )
  })

  it('returns an empty array on database error', async () => {
    mockUserFindMany.mockRejectedValue(new Error('DB error'))

    expect(await getRecentUsers()).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// getRecentSponsors
// ---------------------------------------------------------------------------

describe('getRecentSponsors', () => {
  beforeEach(() => vi.clearAllMocks())

  const MOCK_RECENT_SPONSORS = [
    {
      id: 'sponsor-1',
      name: 'Sponsor Alpha',
      imageUrls: ['https://blob.vercel-storage.com/sponsors/alpha.png'],
      url: 'https://alpha.com',
      createdAt: new Date('2026-03-05'),
    },
    {
      id: 'sponsor-2',
      name: 'Sponsor Beta',
      imageUrls: [],
      url: null,
      createdAt: new Date('2026-03-01'),
    },
  ]

  it('returns recent sponsors', async () => {
    mockSponsorFindMany.mockResolvedValue(MOCK_RECENT_SPONSORS)

    const result = await getRecentSponsors()

    expect(result).toEqual(MOCK_RECENT_SPONSORS)
    expect(mockSponsorFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { createdAt: 'desc' } }),
    )
  })

  it('respects the limit parameter', async () => {
    mockSponsorFindMany.mockResolvedValue([])

    await getRecentSponsors(3)

    expect(mockSponsorFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 3 }),
    )
  })

  it('returns an empty array on database error', async () => {
    mockSponsorFindMany.mockRejectedValue(new Error('DB error'))

    expect(await getRecentSponsors()).toEqual([])
  })
})
