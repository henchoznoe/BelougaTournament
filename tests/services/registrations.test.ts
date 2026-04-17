/**
 * File: tests/services/registrations.test.ts
 * Description: Unit tests for the registrations service.
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
const mockTeamFindMany = vi.fn()
vi.mock('@/lib/core/prisma', () => ({
  default: {
    tournamentRegistration: {
      findMany: (...args: unknown[]) => mockFindMany(...args),
    },
    team: {
      findMany: (...args: unknown[]) => mockTeamFindMany(...args),
    },
  },
}))

// ---------------------------------------------------------------------------
// Module under test
// ---------------------------------------------------------------------------

const { getAllRegistrations, getTeamOptions } = await import(
  '@/lib/services/registrations'
)

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const MOCK_RAW_REGISTRATIONS = [
  {
    id: 'reg-1',
    createdAt: new Date('2026-03-01'),
    status: 'CONFIRMED',
    paymentStatus: 'NOT_REQUIRED',
    payments: [],
    fieldValues: { Pseudo: 'AliceIG' },
    user: {
      id: 'user-1',
      name: 'Alice',
      displayName: 'AliceXYZ',
      image: null,
      bannedUntil: null,
      teamMembers: [],
    },
    tournament: {
      id: 'tourn-1',
      title: 'Tournoi Alpha',
      slug: 'tournoi-alpha',
      format: 'SOLO',
      status: 'PUBLISHED',
      fields: [{ label: 'Pseudo', type: 'TEXT', required: true, order: 0 }],
    },
    team: null,
  },
  {
    id: 'reg-2',
    createdAt: new Date('2026-03-02'),
    status: 'CONFIRMED',
    paymentStatus: 'PAID',
    payments: [
      {
        id: 'payment-1',
        amount: 500,
        currency: 'CHF',
        paidAt: new Date('2026-03-02'),
        refundedAt: null,
      },
    ],
    fieldValues: {},
    user: {
      id: 'user-2',
      name: 'Bob',
      displayName: 'BobXYZ',
      image: 'https://cdn.discordapp.com/avatars/2/b.png',
      bannedUntil: null,
      teamMembers: [
        {
          team: {
            id: 'team-1',
            name: 'Team Alpha',
            captainId: 'user-2',
            isFull: false,
            tournamentId: 'tourn-2',
          },
        },
      ],
    },
    tournament: {
      id: 'tourn-2',
      title: 'Tournoi Beta',
      slug: 'tournoi-beta',
      format: 'TEAM',
      status: 'PUBLISHED',
      fields: [],
    },
    team: { id: 'team-1', name: 'Team Alpha' },
  },
  {
    id: 'reg-3',
    createdAt: new Date('2026-03-03'),
    status: 'PENDING',
    paymentStatus: 'PENDING',
    payments: [],
    fieldValues: {},
    user: {
      id: 'user-3',
      name: 'Carol',
      displayName: 'CarolXYZ',
      image: null,
      bannedUntil: new Date('2027-01-01'),
      teamMembers: [
        {
          team: {
            id: 'team-1',
            name: 'Team Alpha',
            captainId: 'user-2',
            isFull: false,
            tournamentId: 'tourn-2',
          },
        },
      ],
    },
    tournament: {
      id: 'tourn-2',
      title: 'Tournoi Beta',
      slug: 'tournoi-beta',
      format: 'TEAM',
      status: 'PUBLISHED',
      fields: [],
    },
    team: null, // Non-captain — FK is null
  },
]

// ---------------------------------------------------------------------------
// getAllRegistrations
// ---------------------------------------------------------------------------

describe('getAllRegistrations', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns post-processed registrations with team resolved from TeamMember', async () => {
    mockFindMany.mockResolvedValue(MOCK_RAW_REGISTRATIONS)

    const result = await getAllRegistrations()

    expect(result).toHaveLength(3)

    // SOLO registration — no team
    expect(result[0].team).toBeNull()
    expect(result[0].user.bannedUntil).toBeNull()
    expect(result[0].payment).toBeNull()
    // teamMembers should be stripped from user
    expect(
      (result[0].user as Record<string, unknown>).teamMembers,
    ).toBeUndefined()

    // TEAM captain — team resolved from TeamMember
    expect(result[1].team).toEqual({
      id: 'team-1',
      name: 'Team Alpha',
      captainId: 'user-2',
      isFull: false,
    })
    expect(result[1].payment).toEqual({
      id: 'payment-1',
      amount: 500,
      currency: 'CHF',
      paidAt: new Date('2026-03-02'),
      refundedAt: null,
    })

    // TEAM non-captain — team also resolved from TeamMember (not from FK)
    expect(result[2].team).toEqual({
      id: 'team-1',
      name: 'Team Alpha',
      captainId: 'user-2',
      isFull: false,
    })
    expect(result[2].user.bannedUntil).toEqual(new Date('2027-01-01'))
  })

  it('returns an empty array when no registrations exist', async () => {
    mockFindMany.mockResolvedValue([])

    expect(await getAllRegistrations()).toEqual([])
  })

  it('returns an empty array on database error', async () => {
    mockFindMany.mockRejectedValue(new Error('DB error'))

    expect(await getAllRegistrations()).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// getTeamOptions
// ---------------------------------------------------------------------------

describe('getTeamOptions', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns empty object when no tournament IDs provided', async () => {
    expect(await getTeamOptions([])).toEqual({})
    expect(mockTeamFindMany).not.toHaveBeenCalled()
  })

  it('returns teams grouped by tournament ID', async () => {
    mockTeamFindMany.mockResolvedValue([
      { id: 'team-1', name: 'Alpha', isFull: false, tournamentId: 'tourn-1' },
      { id: 'team-2', name: 'Beta', isFull: true, tournamentId: 'tourn-1' },
      { id: 'team-3', name: 'Gamma', isFull: false, tournamentId: 'tourn-2' },
    ])

    const result = await getTeamOptions(['tourn-1', 'tourn-2'])

    expect(result).toEqual({
      'tourn-1': [
        { id: 'team-1', name: 'Alpha', isFull: false },
        { id: 'team-2', name: 'Beta', isFull: true },
      ],
      'tourn-2': [{ id: 'team-3', name: 'Gamma', isFull: false }],
    })
  })

  it('returns empty object on database error', async () => {
    mockTeamFindMany.mockRejectedValue(new Error('DB error'))

    expect(await getTeamOptions(['tourn-1'])).toEqual({})
  })
})
