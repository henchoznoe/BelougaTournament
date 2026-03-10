/**
 * File: tests/services/tournaments.test.ts
 * Description: Unit tests for the tournaments service (admin + public).
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
const mockFindFirst = vi.fn()
const mockRegistrationFindMany = vi.fn()
const mockTeamFindMany = vi.fn()
vi.mock('@/lib/core/prisma', () => ({
  default: {
    tournament: {
      findMany: (...args: unknown[]) => mockFindMany(...args),
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
      findFirst: (...args: unknown[]) => mockFindFirst(...args),
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
  getAvailableTeams,
  getPublishedTournaments,
  getArchivedTournaments,
  getPublicTournamentBySlug,
  getUserRegistrations,
  getUserPastRegistrations,
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
        toornamentStages: {
          orderBy: { number: 'asc' },
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
        toornamentStages: {
          orderBy: { number: 'asc' },
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
  game: 'Valorant',
  imageUrl: null,
  format: 'TEAM',
  teamSize: 5,
  maxTeams: 16,
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
        game: true,
        imageUrl: true,
        format: true,
        teamSize: true,
        maxTeams: true,
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
        game: true,
        imageUrl: true,
        format: true,
        teamSize: true,
        maxTeams: true,
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
      include: {
        fields: {
          orderBy: { order: 'asc' },
        },
        toornamentStages: {
          orderBy: { number: 'asc' },
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
  createdAt: new Date('2026-05-10T10:00:00.000Z'),
  tournament: {
    title: 'Valorant Cup',
    slug: 'valorant-cup',
    game: 'Valorant',
    format: 'TEAM',
    startDate: new Date('2026-06-15T10:00:00.000Z'),
    status: 'PUBLISHED',
  },
}

const MOCK_USER_PAST_REGISTRATION = {
  id: 'reg-user-2',
  createdAt: new Date('2025-11-10T10:00:00.000Z'),
  tournament: {
    title: 'CS2 Winter Cup',
    slug: 'cs2-winter-cup',
    game: 'CS2',
    format: 'TEAM',
    startDate: new Date('2025-12-01T10:00:00.000Z'),
    status: 'ARCHIVED',
  },
}

const USER_REGISTRATION_SELECT = {
  id: true,
  fieldValues: true,
  createdAt: true,
  tournament: {
    select: {
      id: true,
      title: true,
      slug: true,
      game: true,
      format: true,
      startDate: true,
      status: true,
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
        tournament: { status: 'ARCHIVED' },
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
