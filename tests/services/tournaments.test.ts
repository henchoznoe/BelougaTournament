/**
 * File: tests/services/tournaments.test.ts
 * Description: Unit tests for the tournaments service (admin + public).
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock('server-only', () => ({}))
vi.mock('next/cache', () => ({ cacheLife: vi.fn(), cacheTag: vi.fn() }))
vi.mock('@/lib/core/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))

const mockFindMany = vi.fn()
const mockFindUnique = vi.fn()
const mockFindFirst = vi.fn()
const mockCount = vi.fn()
const mockRegistrationFindMany = vi.fn()
const mockTeamFindMany = vi.fn()
vi.mock('@/lib/core/prisma', () => ({
  default: {
    tournament: {
      findMany: (...args: unknown[]) => mockFindMany(...args),
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
      findFirst: (...args: unknown[]) => mockFindFirst(...args),
      count: (...args: unknown[]) => mockCount(...args),
    },
    tournamentRegistration: {
      findMany: (...args: unknown[]) => mockRegistrationFindMany(...args),
    },
    team: {
      findMany: (...args: unknown[]) => mockTeamFindMany(...args),
    },
  },
}))

// ---------------------------------------------------------------------------
// Module under test
// ---------------------------------------------------------------------------

const {
  getTournaments,
  getTournamentBySlug,
  getTournamentById,
  getRegistrations,
  getTeams,
} = await import('@/lib/services/tournaments-admin')

const {
  getAvailableTeams,
  getHeroTournamentBadge,
  getHeroTournamentBadgeData,
  getPublishedTournaments,
  getArchivedTournaments,
  getPublicTournamentBySlug,
  getPublishedTournamentsFiltered,
  getArchivedTournamentsFiltered,
  getTournamentRegistrants,
  getTournamentTeamRegistrants,
} = await import('@/lib/services/tournaments-public')

const { getUserRegistrations, getUserPastRegistrations } = await import(
  '@/lib/services/tournaments-user'
)

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const MOCK_LIST_ITEM = {
  id: 'uuid-1',
  title: 'Valorant Cup',
  slug: 'valorant-cup',
  games: ['Valorant'],
  format: 'TEAM',
  teamSize: 5,
  maxTeams: 16,
  registrationType: 'FREE',
  entryFeeAmount: null,
  entryFeeCurrency: null,
  status: 'PUBLISHED',
  startDate: new Date('2026-06-15T10:00:00.000Z'),
  endDate: new Date('2026-06-17T18:00:00.000Z'),
  registrationOpen: new Date('2026-05-01T00:00:00.000Z'),
  registrationClose: new Date('2026-06-14T23:59:00.000Z'),
  _count: { registrations: 12, teams: 4 },
}

const MOCK_DETAIL = {
  ...MOCK_LIST_ITEM,
  description: 'Tournoi Valorant 5v5.',
  imageUrls: [],
  rules: 'Double élimination.',
  prize: '500 CHF',
  refundPolicyType: 'NONE',
  refundDeadlineDays: null,
  toornamentId: null,
  streamUrl: null,
  createdAt: new Date('2026-04-01T00:00:00.000Z'),
  updatedAt: new Date('2026-04-02T00:00:00.000Z'),
  fields: [
    {
      id: 'field-1',
      label: 'Riot ID',
      type: 'TEXT',
      required: true,
      order: 0,
    },
  ],
}

// ---------------------------------------------------------------------------
// getTournaments
// ---------------------------------------------------------------------------

describe('getTournaments', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns tournaments ordered by status and startDate', async () => {
    mockFindMany.mockResolvedValue([MOCK_LIST_ITEM])

    const result = await getTournaments()

    expect(result).toEqual([MOCK_LIST_ITEM])
    expect(mockFindMany).toHaveBeenCalledWith({
      orderBy: [{ status: 'asc' }, { startDate: 'desc' }],
      select: {
        id: true,
        title: true,
        slug: true,
        games: true,
        format: true,
        teamSize: true,
        maxTeams: true,
        registrationType: true,
        entryFeeAmount: true,
        entryFeeCurrency: true,
        status: true,
        startDate: true,
        endDate: true,
        registrationOpen: true,
        registrationClose: true,
        _count: {
          select: {
            registrations: {
              where: {
                status: { in: ['PENDING', 'CONFIRMED'] },
              },
            },
            teams: true,
          },
        },
      },
    })
  })

  it('returns an empty array when no tournaments exist', async () => {
    mockFindMany.mockResolvedValue([])

    const result = await getTournaments()

    expect(result).toEqual([])
  })

  it('returns an empty array on database error', async () => {
    mockFindMany.mockRejectedValue(new Error('DB error'))

    const result = await getTournaments()

    expect(result).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// Shared fixture for filtered tournament pages
// ---------------------------------------------------------------------------

const MOCK_FILTERED_LIST_ITEM = {
  id: 'uuid-pub-1',
  title: 'Valorant Cup',
  slug: 'valorant-cup',
  games: ['Valorant'],
  format: 'TEAM',
  teamSize: 5,
  maxTeams: 16,
  registrationType: 'FREE',
  entryFeeAmount: null,
  entryFeeCurrency: null,
  startDate: new Date('2026-06-15T10:00:00.000Z'),
  endDate: new Date('2026-06-17T18:00:00.000Z'),
  registrationOpen: new Date('2026-05-01T00:00:00.000Z'),
  registrationClose: new Date('2026-06-01T00:00:00.000Z'),
  imageUrls: [],
  _count: { registrations: 12 },
}

const DEFAULT_FILTERS = {
  search: '',
  format: '' as const,
  type: '' as const,
  sort: 'date_asc' as const,
  page: 1,
}

// ---------------------------------------------------------------------------
// getPublishedTournamentsFiltered
// ---------------------------------------------------------------------------

describe('getPublishedTournamentsFiltered', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFindMany.mockResolvedValue([MOCK_FILTERED_LIST_ITEM])
    mockCount.mockResolvedValue(1)
  })

  it('returns tournaments and pagination metadata', async () => {
    const result = await getPublishedTournamentsFiltered(DEFAULT_FILTERS)

    expect(result.tournaments).toHaveLength(1)
    expect(result.total).toBe(1)
    expect(result.page).toBe(1)
    expect(result.totalPages).toBe(1)
  })

  it('passes search filter to where clause', async () => {
    await getPublishedTournamentsFiltered({
      ...DEFAULT_FILTERS,
      search: 'Valorant',
    })

    const call = mockFindMany.mock.calls[0][0]
    expect(call.where.OR).toBeDefined()
    expect(call.where.OR[0].title.contains).toBe('Valorant')
  })

  it('passes format filter to where clause', async () => {
    await getPublishedTournamentsFiltered({
      ...DEFAULT_FILTERS,
      format: 'TEAM' as const,
    })

    const call = mockFindMany.mock.calls[0][0]
    expect(call.where.format).toBe('TEAM')
  })

  it('passes type filter to where clause', async () => {
    await getPublishedTournamentsFiltered({
      ...DEFAULT_FILTERS,
      type: 'FREE' as const,
    })

    const call = mockFindMany.mock.calls[0][0]
    expect(call.where.registrationType).toBe('FREE')
  })

  it('computes correct skip for page 2', async () => {
    mockCount.mockResolvedValue(20)
    await getPublishedTournamentsFiltered({ ...DEFAULT_FILTERS, page: 2 })

    const call = mockFindMany.mock.calls[0][0]
    expect(call.skip).toBeGreaterThan(0)
  })

  it('sorts by registrations_desc in-memory', async () => {
    const itemA = {
      ...MOCK_FILTERED_LIST_ITEM,
      id: 'a',
      _count: { registrations: 5 },
    }
    const itemB = {
      ...MOCK_FILTERED_LIST_ITEM,
      id: 'b',
      _count: { registrations: 20 },
    }
    mockFindMany.mockResolvedValue([itemA, itemB])
    mockCount.mockResolvedValue(2)

    const result = await getPublishedTournamentsFiltered({
      ...DEFAULT_FILTERS,
      sort: 'registrations_desc',
    })

    expect(result.tournaments[0]._count.registrations).toBe(20)
    expect(result.tournaments[1]._count.registrations).toBe(5)
  })

  it('passes date_desc ordering to the query', async () => {
    await getPublishedTournamentsFiltered({
      ...DEFAULT_FILTERS,
      sort: 'date_desc',
    })

    const call = mockFindMany.mock.calls[0][0]
    expect(call.orderBy).toEqual({ startDate: 'desc' })
  })

  it('passes title_asc ordering to the query', async () => {
    await getPublishedTournamentsFiltered({
      ...DEFAULT_FILTERS,
      sort: 'title_asc',
    })

    const call = mockFindMany.mock.calls[0][0]
    expect(call.orderBy).toEqual({ title: 'asc' })
  })

  it('passes title_desc ordering to the query', async () => {
    await getPublishedTournamentsFiltered({
      ...DEFAULT_FILTERS,
      sort: 'title_desc',
    })

    const call = mockFindMany.mock.calls[0][0]
    expect(call.orderBy).toEqual({ title: 'desc' })
  })

  it('returns empty result on database error', async () => {
    mockFindMany.mockRejectedValue(new Error('DB error'))

    const result = await getPublishedTournamentsFiltered(DEFAULT_FILTERS)

    expect(result.tournaments).toEqual([])
    expect(result.total).toBe(0)
    expect(result.totalPages).toBe(1)
  })

  it('returns at least 1 total page when there are no results', async () => {
    mockFindMany.mockResolvedValue([])
    mockCount.mockResolvedValue(0)

    const result = await getPublishedTournamentsFiltered(DEFAULT_FILTERS)

    expect(result.totalPages).toBe(1)
  })
})

// ---------------------------------------------------------------------------
// getArchivedTournamentsFiltered
// ---------------------------------------------------------------------------

describe('getArchivedTournamentsFiltered', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFindMany.mockResolvedValue([MOCK_FILTERED_LIST_ITEM])
    mockCount.mockResolvedValue(1)
  })

  it('returns archived tournaments and pagination metadata', async () => {
    const result = await getArchivedTournamentsFiltered(DEFAULT_FILTERS)

    expect(result.tournaments).toHaveLength(1)
    expect(result.total).toBe(1)
    expect(result.page).toBe(1)
    expect(result.totalPages).toBe(1)
  })

  it('passes search filter to where clause with ARCHIVED status', async () => {
    await getArchivedTournamentsFiltered({ ...DEFAULT_FILTERS, search: 'CS2' })

    const call = mockFindMany.mock.calls[0][0]
    expect(call.where.status).toBe('ARCHIVED')
    expect(call.where.OR).toBeDefined()
  })

  it('passes format filter to where clause', async () => {
    await getArchivedTournamentsFiltered({
      ...DEFAULT_FILTERS,
      format: 'SOLO' as const,
    })

    const call = mockFindMany.mock.calls[0][0]
    expect(call.where.format).toBe('SOLO')
  })

  it('sorts by registrations_desc in-memory', async () => {
    const itemA = {
      ...MOCK_FILTERED_LIST_ITEM,
      id: 'a',
      _count: { registrations: 3 },
    }
    const itemB = {
      ...MOCK_FILTERED_LIST_ITEM,
      id: 'b',
      _count: { registrations: 15 },
    }
    mockFindMany.mockResolvedValue([itemA, itemB])
    mockCount.mockResolvedValue(2)

    const result = await getArchivedTournamentsFiltered({
      ...DEFAULT_FILTERS,
      sort: 'registrations_desc',
    })

    expect(result.tournaments[0]._count.registrations).toBe(15)
  })

  it('returns empty result on database error', async () => {
    mockFindMany.mockRejectedValue(new Error('DB error'))

    const result = await getArchivedTournamentsFiltered(DEFAULT_FILTERS)

    expect(result.tournaments).toEqual([])
    expect(result.total).toBe(0)
    expect(result.totalPages).toBe(1)
  })
})
// ---------------------------------------------------------------------------
// getTournamentBySlug
// ---------------------------------------------------------------------------

describe('getTournamentBySlug', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns tournament detail for a valid slug', async () => {
    mockFindUnique.mockResolvedValue(MOCK_DETAIL)

    const result = await getTournamentBySlug('valorant-cup')

    expect(result).toEqual(MOCK_DETAIL)
    expect(mockFindUnique).toHaveBeenCalledWith({
      where: { slug: 'valorant-cup' },
      include: {
        fields: {
          orderBy: { order: 'asc' },
        },
        toornamentStages: {
          orderBy: { number: 'asc' },
        },
        _count: {
          select: {
            registrations: {
              where: {
                status: { in: ['PENDING', 'CONFIRMED'] },
              },
            },
            teams: true,
          },
        },
      },
    })
  })

  it('returns null when tournament is not found', async () => {
    mockFindUnique.mockResolvedValue(null)

    const result = await getTournamentBySlug('nonexistent')

    expect(result).toBeNull()
  })

  it('returns null on database error', async () => {
    mockFindUnique.mockRejectedValue(new Error('DB error'))

    const result = await getTournamentBySlug('valorant-cup')

    expect(result).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// getTournamentById
// ---------------------------------------------------------------------------

describe('getTournamentById', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns tournament detail for a valid ID', async () => {
    mockFindUnique.mockResolvedValue(MOCK_DETAIL)

    const result = await getTournamentById('uuid-1')

    expect(result).toEqual(MOCK_DETAIL)
    expect(mockFindUnique).toHaveBeenCalledWith({
      where: { id: 'uuid-1' },
      include: {
        fields: {
          orderBy: { order: 'asc' },
        },
        toornamentStages: {
          orderBy: { number: 'asc' },
        },
        _count: {
          select: {
            registrations: {
              where: {
                status: { in: ['PENDING', 'CONFIRMED'] },
              },
            },
            teams: true,
          },
        },
      },
    })
  })

  it('returns null when tournament is not found', async () => {
    mockFindUnique.mockResolvedValue(null)

    const result = await getTournamentById('nonexistent-id')

    expect(result).toBeNull()
  })

  it('returns null on database error', async () => {
    mockFindUnique.mockRejectedValue(new Error('DB error'))

    const result = await getTournamentById('uuid-1')

    expect(result).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// Fixtures — registrations & teams
// ---------------------------------------------------------------------------

const MOCK_REGISTRATION = {
  id: 'reg-1',
  fieldValues: { 'Riot ID': 'Player#1234' },
  donationAmountSnapshot: null,
  createdAt: new Date('2026-05-10T10:00:00.000Z'),
  status: 'CONFIRMED',
  paymentStatus: 'NOT_REQUIRED',
  user: {
    id: 'user-1',
    name: 'player1',
    displayName: 'Player One',
    image: null,
  },
  team: {
    id: 'team-1',
    name: 'Alpha Squad',
    captainId: 'user-1',
    isFull: false,
    logoUrl: null,
  },
}

/** Raw shape returned by Prisma before post-processing (includes teamMembers). */
const MOCK_RAW_REGISTRATION = {
  id: 'reg-1',
  fieldValues: { 'Riot ID': 'Player#1234' },
  donationAmountSnapshot: null,
  createdAt: new Date('2026-05-10T10:00:00.000Z'),
  status: 'CONFIRMED',
  paymentStatus: 'NOT_REQUIRED',
  user: {
    id: 'user-1',
    name: 'player1',
    displayName: 'Player One',
    image: null,
    teamMembers: [
      {
        team: {
          id: 'team-1',
          name: 'Alpha Squad',
          captainId: 'user-1',
          isFull: false,
          logoUrl: null,
        },
      },
    ],
  },
  team: {
    id: 'team-1',
    name: 'Alpha Squad',
  },
}

const MOCK_RAW_REGISTRATION_WITHOUT_MEMBERSHIP = {
  ...MOCK_RAW_REGISTRATION,
  user: {
    ...MOCK_RAW_REGISTRATION.user,
    teamMembers: [],
  },
}

const MOCK_TEAM = {
  id: 'team-1',
  name: 'Alpha Squad',
  logoUrl: null,
  isFull: false,
  createdAt: new Date('2026-05-10T10:00:00.000Z'),
  captain: {
    id: 'user-1',
    name: 'captain1',
    displayName: 'Captain One',
    image: null,
  },
  members: [
    {
      id: 'member-1',
      joinedAt: new Date('2026-05-10T10:00:00.000Z'),
      user: {
        id: 'user-1',
        name: 'captain1',
        displayName: 'Captain One',
        image: null,
      },
    },
  ],
}

// ---------------------------------------------------------------------------
// getRegistrations
// ---------------------------------------------------------------------------

describe('getRegistrations', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns registrations for a tournament', async () => {
    mockRegistrationFindMany.mockResolvedValue([MOCK_RAW_REGISTRATION])

    const result = await getRegistrations('tournament-1')

    expect(result).toEqual([MOCK_REGISTRATION])
    expect(mockRegistrationFindMany).toHaveBeenCalledWith({
      where: {
        tournamentId: 'tournament-1',
        status: { in: ['PENDING', 'CONFIRMED'] },
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        fieldValues: true,
        donationAmountSnapshot: true,
        createdAt: true,
        status: true,
        paymentStatus: true,
        user: {
          select: {
            id: true,
            name: true,
            displayName: true,
            image: true,
            teamMembers: {
              where: { team: { tournamentId: 'tournament-1' } },
              select: {
                team: {
                  select: {
                    id: true,
                    name: true,
                    captainId: true,
                    isFull: true,
                    logoUrl: true,
                  },
                },
              },
            },
          },
        },
        team: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })
  })

  it('returns an empty array when no registrations exist', async () => {
    mockRegistrationFindMany.mockResolvedValue([])

    const result = await getRegistrations('tournament-1')

    expect(result).toEqual([])
  })

  it('returns a null team when the user has no team membership in the tournament', async () => {
    mockRegistrationFindMany.mockResolvedValue([
      MOCK_RAW_REGISTRATION_WITHOUT_MEMBERSHIP,
    ])

    const result = await getRegistrations('tournament-1')

    expect(result).toEqual([
      {
        ...MOCK_REGISTRATION,
        team: null,
      },
    ])
  })

  it('returns an empty array on database error', async () => {
    mockRegistrationFindMany.mockRejectedValue(new Error('DB error'))

    const result = await getRegistrations('tournament-1')

    expect(result).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// getTeams
// ---------------------------------------------------------------------------

describe('getTeams', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns teams for a tournament', async () => {
    mockTeamFindMany.mockResolvedValue([MOCK_TEAM])

    const result = await getTeams('tournament-1')

    expect(result).toEqual([MOCK_TEAM])
    expect(mockTeamFindMany).toHaveBeenCalledWith({
      where: { tournamentId: 'tournament-1' },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        logoUrl: true,
        isFull: true,
        createdAt: true,
        captain: {
          select: {
            id: true,
            name: true,
            displayName: true,
            image: true,
          },
        },
        members: {
          orderBy: { joinedAt: 'asc' },
          select: {
            id: true,
            joinedAt: true,
            user: {
              select: {
                id: true,
                name: true,
                displayName: true,
                image: true,
              },
            },
          },
        },
      },
    })
  })

  it('returns an empty array when no teams exist', async () => {
    mockTeamFindMany.mockResolvedValue([])

    const result = await getTeams('tournament-1')

    expect(result).toEqual([])
  })

  it('returns an empty array on database error', async () => {
    mockTeamFindMany.mockRejectedValue(new Error('DB error'))

    const result = await getTeams('tournament-1')

    expect(result).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// Fixtures — available teams
// ---------------------------------------------------------------------------

const MOCK_AVAILABLE_TEAM = {
  id: 'team-1',
  name: 'Alpha Squad',
  captain: { displayName: 'Captain One' },
  _count: { members: 3 },
}

// ---------------------------------------------------------------------------
// getAvailableTeams
// ---------------------------------------------------------------------------

describe('getAvailableTeams', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns non-full teams for a tournament', async () => {
    mockTeamFindMany.mockResolvedValue([MOCK_AVAILABLE_TEAM])

    const result = await getAvailableTeams('tournament-1')

    expect(result).toEqual([MOCK_AVAILABLE_TEAM])
    expect(mockTeamFindMany).toHaveBeenCalledWith({
      where: { tournamentId: 'tournament-1', isFull: false },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        name: true,
        captain: {
          select: {
            displayName: true,
          },
        },
        _count: {
          select: {
            members: true,
          },
        },
      },
    })
  })

  it('returns empty array when no teams available', async () => {
    mockTeamFindMany.mockResolvedValue([])

    const result = await getAvailableTeams('tournament-1')

    expect(result).toEqual([])
  })

  it('returns empty array on database error', async () => {
    mockTeamFindMany.mockRejectedValue(new Error('DB error'))

    const result = await getAvailableTeams('tournament-1')

    expect(result).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// Fixtures — public tournaments
// ---------------------------------------------------------------------------

const MOCK_PUBLIC_LIST_ITEM = {
  id: 'uuid-1',
  title: 'Valorant Cup',
  slug: 'valorant-cup',
  description: 'Tournoi Valorant 5v5.',
  games: ['Valorant'],
  imageUrls: [],
  format: 'TEAM',
  teamSize: 5,
  maxTeams: 16,
  registrationType: 'FREE',
  entryFeeAmount: null,
  entryFeeCurrency: null,
  status: 'PUBLISHED',
  startDate: new Date('2026-06-15T10:00:00.000Z'),
  endDate: new Date('2026-06-17T18:00:00.000Z'),
  registrationOpen: new Date('2026-05-01T00:00:00.000Z'),
  registrationClose: new Date('2026-06-14T23:59:00.000Z'),
  _count: { registrations: 12, teams: 4 },
}

const MOCK_PUBLIC_DETAIL = {
  ...MOCK_PUBLIC_LIST_ITEM,
  rules: 'Double élimination.',
  prize: '500 CHF',
  refundPolicyType: 'NONE',
  refundDeadlineDays: null,
  toornamentId: null,
  streamUrl: null,
  fields: [
    {
      id: 'field-1',
      label: 'Riot ID',
      type: 'TEXT',
      required: true,
      order: 0,
    },
  ],
}

// ---------------------------------------------------------------------------
// getHeroTournamentBadge
// ---------------------------------------------------------------------------

describe('getHeroTournamentBadge', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns a live badge when a published tournament is currently running', async () => {
    vi.setSystemTime(new Date('2026-06-15T12:00:00.000Z'))
    mockFindMany.mockResolvedValue([MOCK_PUBLIC_LIST_ITEM])

    const result = await getHeroTournamentBadge()

    expect(result).toEqual({
      label: 'Valorant Cup en cours',
      variant: 'live',
    })
    expect(mockFindMany).toHaveBeenCalledWith({
      where: { status: 'PUBLISHED' },
      orderBy: { startDate: 'asc' },
      select: {
        slug: true,
        title: true,
        startDate: true,
        endDate: true,
      },
    })
  })

  it('returns an upcoming badge in hours when the next tournament starts soon', async () => {
    vi.setSystemTime(new Date('2026-06-15T07:00:00.000Z'))
    mockFindMany.mockResolvedValue([MOCK_PUBLIC_LIST_ITEM])

    const result = await getHeroTournamentBadge()

    expect(result).toEqual({
      label: 'Valorant Cup dans 3 heures',
      variant: 'upcoming',
    })
  })

  it('returns an upcoming badge with minutes when the next tournament is close', async () => {
    vi.setSystemTime(new Date('2026-06-15T09:48:00.000Z'))
    mockFindMany.mockResolvedValue([MOCK_PUBLIC_LIST_ITEM])

    const result = await getHeroTournamentBadge()

    expect(result).toEqual({
      label: 'Valorant Cup dans 12 minutes',
      variant: 'upcoming',
    })
  })

  it('returns an upcoming badge in days when the next tournament is farther away', async () => {
    vi.setSystemTime(new Date('2026-06-10T10:00:00.000Z'))
    mockFindMany.mockResolvedValue([MOCK_PUBLIC_LIST_ITEM])

    const result = await getHeroTournamentBadge()

    expect(result).toEqual({
      label: 'Valorant Cup dans 5 jours',
      variant: 'upcoming',
    })
  })

  it('returns the idle badge when there is no live or upcoming tournament', async () => {
    vi.setSystemTime(new Date('2026-06-20T10:00:00.000Z'))
    mockFindMany.mockResolvedValue([MOCK_PUBLIC_LIST_ITEM])

    const result = await getHeroTournamentBadge()

    expect(result).toEqual({
      label: 'Aucun tournoi en cours',
      variant: 'idle',
    })
  })

  it('returns both the initial badge and tournament timings for client refreshes', async () => {
    vi.setSystemTime(new Date('2026-06-15T09:48:00.000Z'))
    mockFindMany.mockResolvedValue([MOCK_PUBLIC_LIST_ITEM])

    const result = await getHeroTournamentBadgeData()

    expect(result.badge).toEqual({
      label: 'Valorant Cup dans 12 minutes',
      variant: 'upcoming',
    })
    expect(result.tournaments).toEqual([
      expect.objectContaining({
        title: 'Valorant Cup',
        startDate: new Date('2026-06-15T10:00:00.000Z'),
        endDate: new Date('2026-06-17T18:00:00.000Z'),
      }),
    ])
  })

  it('returns the default hero badge payload on database error', async () => {
    mockFindMany.mockRejectedValue(new Error('DB error'))

    const result = await getHeroTournamentBadgeData()

    expect(result).toEqual({
      badge: {
        label: 'Aucun tournoi en cours',
        variant: 'idle',
      },
      tournaments: [],
    })
  })
})

// ---------------------------------------------------------------------------
// getPublishedTournaments
// ---------------------------------------------------------------------------

describe('getPublishedTournaments', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns published tournaments ordered by startDate ascending', async () => {
    mockFindMany.mockResolvedValue([MOCK_PUBLIC_LIST_ITEM])

    const result = await getPublishedTournaments()

    expect(result).toEqual([MOCK_PUBLIC_LIST_ITEM])
    expect(mockFindMany).toHaveBeenCalledWith({
      where: { status: 'PUBLISHED' },
      orderBy: { startDate: 'asc' },
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
        games: true,
        imageUrls: true,
        format: true,
        teamSize: true,
        maxTeams: true,
        registrationType: true,
        entryFeeAmount: true,
        entryFeeCurrency: true,
        status: true,
        startDate: true,
        endDate: true,
        registrationOpen: true,
        registrationClose: true,
        _count: {
          select: {
            registrations: true,
            teams: true,
          },
        },
      },
    })
  })

  it('returns an empty array when no published tournaments exist', async () => {
    mockFindMany.mockResolvedValue([])

    const result = await getPublishedTournaments()

    expect(result).toEqual([])
  })

  it('returns an empty array on database error', async () => {
    mockFindMany.mockRejectedValue(new Error('DB error'))

    const result = await getPublishedTournaments()

    expect(result).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// getArchivedTournaments
// ---------------------------------------------------------------------------

describe('getArchivedTournaments', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns archived tournaments ordered by startDate descending', async () => {
    const archivedItem = { ...MOCK_PUBLIC_LIST_ITEM, status: 'ARCHIVED' }
    mockFindMany.mockResolvedValue([archivedItem])

    const result = await getArchivedTournaments()

    expect(result).toEqual([archivedItem])
    expect(mockFindMany).toHaveBeenCalledWith({
      where: { status: 'ARCHIVED' },
      orderBy: { startDate: 'desc' },
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
        games: true,
        imageUrls: true,
        format: true,
        teamSize: true,
        maxTeams: true,
        registrationType: true,
        entryFeeAmount: true,
        entryFeeCurrency: true,
        status: true,
        startDate: true,
        endDate: true,
        registrationOpen: true,
        registrationClose: true,
        _count: {
          select: {
            registrations: true,
            teams: true,
          },
        },
      },
    })
  })

  it('returns an empty array when no archived tournaments exist', async () => {
    mockFindMany.mockResolvedValue([])

    const result = await getArchivedTournaments()

    expect(result).toEqual([])
  })

  it('returns an empty array on database error', async () => {
    mockFindMany.mockRejectedValue(new Error('DB error'))

    const result = await getArchivedTournaments()

    expect(result).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// getPublicTournamentBySlug
// ---------------------------------------------------------------------------

describe('getPublicTournamentBySlug', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns tournament detail for a published slug', async () => {
    mockFindFirst.mockResolvedValue(MOCK_PUBLIC_DETAIL)

    const result = await getPublicTournamentBySlug('valorant-cup')

    expect(result).toEqual(MOCK_PUBLIC_DETAIL)
    expect(mockFindFirst).toHaveBeenCalledWith({
      where: {
        slug: 'valorant-cup',
        status: { in: ['PUBLISHED', 'ARCHIVED'] },
      },
      select: expect.objectContaining({
        showRegistrants: true,
        fields: { orderBy: { order: 'asc' } },
        toornamentStages: { orderBy: { number: 'asc' } },
      }),
    })
  })

  it('returns null when tournament is not found', async () => {
    mockFindFirst.mockResolvedValue(null)

    const result = await getPublicTournamentBySlug('nonexistent')

    expect(result).toBeNull()
  })

  it('returns null on database error', async () => {
    mockFindFirst.mockRejectedValue(new Error('DB error'))

    const result = await getPublicTournamentBySlug('valorant-cup')

    expect(result).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// Fixtures — user registrations
// ---------------------------------------------------------------------------

const MOCK_USER_REGISTRATION = {
  id: 'reg-user-1',
  fieldValues: {},
  createdAt: new Date('2026-05-10T10:00:00.000Z'),
  status: 'CONFIRMED',
  paymentStatus: 'NOT_REQUIRED',
  paymentRequiredSnapshot: false,
  tournament: {
    id: 'uuid-1',
    title: 'Valorant Cup',
    slug: 'valorant-cup',
    games: ['Valorant'],
    format: 'TEAM',
    teamSize: 5,
    startDate: new Date('2026-06-15T10:00:00.000Z'),
    status: 'PUBLISHED',
    registrationType: 'FREE',
    entryFeeAmount: null,
    entryFeeCurrency: null,
    refundPolicyType: 'NONE',
    refundDeadlineDays: null,
    teamLogoEnabled: false,
    fields: [],
  },
  team: null,
}

const MOCK_USER_PAST_REGISTRATION = {
  id: 'reg-user-2',
  fieldValues: {},
  createdAt: new Date('2025-11-10T10:00:00.000Z'),
  status: 'CONFIRMED',
  paymentStatus: 'NOT_REQUIRED',
  paymentRequiredSnapshot: false,
  tournament: {
    id: 'uuid-2',
    title: 'CS2 Winter Cup',
    slug: 'cs2-winter-cup',
    games: ['CS2'],
    format: 'TEAM',
    teamSize: 5,
    startDate: new Date('2025-12-01T10:00:00.000Z'),
    status: 'ARCHIVED',
    registrationType: 'FREE',
    entryFeeAmount: null,
    entryFeeCurrency: null,
    refundPolicyType: 'NONE',
    refundDeadlineDays: null,
    teamLogoEnabled: false,
    fields: [],
  },
  team: null,
}

const USER_REGISTRATION_SELECT = {
  id: true,
  fieldValues: true,
  createdAt: true,
  status: true,
  paymentStatus: true,
  paymentRequiredSnapshot: true,
  tournament: {
    select: {
      id: true,
      title: true,
      slug: true,
      games: true,
      format: true,
      teamSize: true,
      startDate: true,
      endDate: true,
      description: true,
      status: true,
      registrationType: true,
      entryFeeAmount: true,
      entryFeeCurrency: true,
      refundPolicyType: true,
      refundDeadlineDays: true,
      teamLogoEnabled: true,
      fields: {
        orderBy: { order: 'asc' },
        select: {
          id: true,
          label: true,
          type: true,
          required: true,
          order: true,
        },
      },
    },
  },
  team: {
    select: {
      id: true,
      name: true,
      captainId: true,
      logoUrl: true,
    },
  },
}

// ---------------------------------------------------------------------------
// getUserRegistrations
// ---------------------------------------------------------------------------

describe('getUserRegistrations', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns active registrations for a user', async () => {
    mockRegistrationFindMany.mockResolvedValue([MOCK_USER_REGISTRATION])

    const result = await getUserRegistrations('user-1')

    expect(result).toEqual([MOCK_USER_REGISTRATION])
    expect(mockRegistrationFindMany).toHaveBeenCalledWith({
      where: {
        userId: 'user-1',
        status: { in: ['PENDING', 'CONFIRMED'] },
        tournament: { status: 'PUBLISHED' },
      },
      orderBy: { createdAt: 'desc' },
      select: USER_REGISTRATION_SELECT,
    })
  })

  it('returns an empty array when user has no active registrations', async () => {
    mockRegistrationFindMany.mockResolvedValue([])

    const result = await getUserRegistrations('user-1')

    expect(result).toEqual([])
  })

  it('returns an empty array on database error', async () => {
    mockRegistrationFindMany.mockRejectedValue(new Error('DB error'))

    const result = await getUserRegistrations('user-1')

    expect(result).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// getUserPastRegistrations
// ---------------------------------------------------------------------------

describe('getUserPastRegistrations', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns past registrations for a user', async () => {
    mockRegistrationFindMany.mockResolvedValue([MOCK_USER_PAST_REGISTRATION])

    const result = await getUserPastRegistrations('user-1')

    expect(result).toEqual([MOCK_USER_PAST_REGISTRATION])
    expect(mockRegistrationFindMany).toHaveBeenCalledWith({
      where: {
        userId: 'user-1',
        OR: [
          {
            status: 'CONFIRMED',
            tournament: { status: 'ARCHIVED' },
          },
          {
            status: 'CANCELLED',
            paymentStatus: 'REFUNDED',
            tournament: { status: 'ARCHIVED' },
          },
        ],
      },
      orderBy: { createdAt: 'desc' },
      select: USER_REGISTRATION_SELECT,
    })
  })

  it('returns an empty array when user has no past registrations', async () => {
    mockRegistrationFindMany.mockResolvedValue([])

    const result = await getUserPastRegistrations('user-1')

    expect(result).toEqual([])
  })

  it('returns an empty array on database error', async () => {
    mockRegistrationFindMany.mockRejectedValue(new Error('DB error'))

    const result = await getUserPastRegistrations('user-1')

    expect(result).toEqual([])
  })
})

// ===========================================================================
// getTournamentRegistrants
// ===========================================================================

describe('getTournamentRegistrants', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns mapped registrants for confirmed solo registrations', async () => {
    mockRegistrationFindMany.mockResolvedValue([
      {
        user: {
          id: 'u1',
          displayName: 'Alice',
          image: 'https://img/alice.png',
          isPublic: true,
        },
      },
      {
        user: {
          id: 'u2',
          displayName: 'Bob',
          image: null,
          isPublic: false,
        },
      },
    ])

    const result = await getTournamentRegistrants('t1')

    expect(result).toEqual([
      {
        userId: 'u1',
        displayName: 'Alice',
        image: 'https://img/alice.png',
        isPublic: true,
      },
      {
        userId: 'u2',
        displayName: 'Bob',
        image: null,
        isPublic: false,
      },
    ])
    expect(mockRegistrationFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { tournamentId: 't1', status: 'CONFIRMED' },
      }),
    )
  })

  it('returns an empty array when no registrants exist', async () => {
    mockRegistrationFindMany.mockResolvedValue([])

    const result = await getTournamentRegistrants('t1')

    expect(result).toEqual([])
  })

  it('returns an empty array on database error', async () => {
    mockRegistrationFindMany.mockRejectedValue(new Error('DB error'))

    const result = await getTournamentRegistrants('t1')

    expect(result).toEqual([])
  })
})

// ===========================================================================
// getTournamentTeamRegistrants
// ===========================================================================

describe('getTournamentTeamRegistrants', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns mapped team registrants with members', async () => {
    mockTeamFindMany.mockResolvedValue([
      {
        id: 'team1',
        name: 'Team Alpha',
        logoUrl: 'https://img/alpha.png',
        members: [
          {
            user: {
              id: 'u1',
              displayName: 'Alice',
              image: 'https://img/alice.png',
              isPublic: true,
            },
          },
          {
            user: {
              id: 'u2',
              displayName: 'Bob',
              image: null,
              isPublic: false,
            },
          },
        ],
      },
    ])

    const result = await getTournamentTeamRegistrants('t1')

    expect(result).toEqual([
      {
        teamId: 'team1',
        teamName: 'Team Alpha',
        logoUrl: 'https://img/alpha.png',
        members: [
          {
            userId: 'u1',
            displayName: 'Alice',
            image: 'https://img/alice.png',
            isPublic: true,
          },
          {
            userId: 'u2',
            displayName: 'Bob',
            image: null,
            isPublic: false,
          },
        ],
      },
    ])
    expect(mockTeamFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { tournamentId: 't1' },
      }),
    )
  })

  it('returns an empty array when no teams exist', async () => {
    mockTeamFindMany.mockResolvedValue([])

    const result = await getTournamentTeamRegistrants('t1')

    expect(result).toEqual([])
  })

  it('returns an empty array on database error', async () => {
    mockTeamFindMany.mockRejectedValue(new Error('DB error'))

    const result = await getTournamentTeamRegistrants('t1')

    expect(result).toEqual([])
  })
})
