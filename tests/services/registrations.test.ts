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
vi.mock('@/lib/core/prisma', () => ({
  default: {
    tournamentRegistration: {
      findMany: (...args: unknown[]) => mockFindMany(...args),
    },
  },
}))

// ---------------------------------------------------------------------------
// Module under test
// ---------------------------------------------------------------------------

const { getAllRegistrations } = await import('@/lib/services/registrations')

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const MOCK_REGISTRATIONS = [
  {
    id: 'reg-1',
    createdAt: new Date('2026-03-01'),
    user: {
      id: 'user-1',
      name: 'Alice',
      displayName: 'AliceXYZ',
      image: null,
    },
    tournament: {
      id: 'tourn-1',
      title: 'Tournoi Alpha',
      slug: 'tournoi-alpha',
      format: 'SOLO',
      status: 'PUBLISHED',
    },
    team: null,
  },
  {
    id: 'reg-2',
    createdAt: new Date('2026-03-02'),
    user: {
      id: 'user-2',
      name: 'Bob',
      displayName: 'BobXYZ',
      image: 'https://cdn.discordapp.com/avatars/2/b.png',
    },
    tournament: {
      id: 'tourn-2',
      title: 'Tournoi Beta',
      slug: 'tournoi-beta',
      format: 'TEAM',
      status: 'PUBLISHED',
    },
    team: {
      id: 'team-1',
      name: 'Team Alpha',
    },
  },
]

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('getAllRegistrations', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns the list of registrations', async () => {
    mockFindMany.mockResolvedValue(MOCK_REGISTRATIONS)

    const result = await getAllRegistrations()

    expect(result).toEqual(MOCK_REGISTRATIONS)
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
