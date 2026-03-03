/**
 * File: tests/services/tournaments.test.ts
 * Description: Unit tests for the tournaments service.
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
const mockFindUnique = vi.fn()
const mockRegistrationFindMany = vi.fn()
const mockTeamFindMany = vi.fn()
vi.mock('@/lib/core/prisma', () => ({
  default: {
    tournament: {
      findMany: (...args: unknown[]) => mockFindMany(...args),
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
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
} = await import('@/lib/services/tournaments')

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const MOCK_LIST_ITEM = {
  id: 'uuid-1',
  title: 'Valorant Cup',
  slug: 'valorant-cup',
  game: 'Valorant',
  format: 'TEAM',
  teamSize: 5,
  maxTeams: 16,
  status: 'PUBLISHED',
  startDate: new Date('2026-06-15T10:00:00.000Z'),
  endDate: new Date('2026-06-17T18:00:00.000Z'),
  registrationOpen: new Date('2026-05-01T00:00:00.000Z'),
  registrationClose: new Date('2026-06-14T23:59:00.000Z'),
  autoApprove: false,
  _count: { registrations: 12, teams: 4 },
}

const MOCK_DETAIL = {
  ...MOCK_LIST_ITEM,
  description: 'Tournoi Valorant 5v5.',
  imageUrl: null,
  rules: 'Double élimination.',
  prize: '500 CHF',
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
        game: true,
        format: true,
        teamSize: true,
        maxTeams: true,
        status: true,
        startDate: true,
        endDate: true,
        registrationOpen: true,
        registrationClose: true,
        autoApprove: true,
        _count: {
          select: {
            registrations: true,
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
        _count: {
          select: {
            registrations: true,
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
        _count: {
          select: {
            registrations: true,
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
  status: 'PENDING',
  fieldValues: { 'Riot ID': 'Player#1234' },
  createdAt: new Date('2026-05-10T10:00:00.000Z'),
  user: {
    id: 'user-1',
    name: 'player1',
    displayName: 'Player One',
    image: null,
  },
  team: {
    id: 'team-1',
    name: 'Alpha Squad',
  },
}

const MOCK_TEAM = {
  id: 'team-1',
  name: 'Alpha Squad',
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
  registration: {
    id: 'reg-1',
    status: 'PENDING',
  },
}

// ---------------------------------------------------------------------------
// getRegistrations
// ---------------------------------------------------------------------------

describe('getRegistrations', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns registrations for a tournament', async () => {
    mockRegistrationFindMany.mockResolvedValue([MOCK_REGISTRATION])

    const result = await getRegistrations('tournament-1')

    expect(result).toEqual([MOCK_REGISTRATION])
    expect(mockRegistrationFindMany).toHaveBeenCalledWith({
      where: { tournamentId: 'tournament-1' },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        status: true,
        fieldValues: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            name: true,
            displayName: true,
            image: true,
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
        registration: {
          select: {
            id: true,
            status: true,
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
