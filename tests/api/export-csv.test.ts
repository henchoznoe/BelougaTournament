/**
 * File: tests/api/export-csv.test.ts
 * Description: Unit tests for the CSV export API route.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Role } from '@/prisma/generated/prisma/enums'

vi.mock('server-only', () => ({}))

const mockGetSession = vi.fn()
vi.mock('@/lib/core/auth', () => ({
  default: {
    api: { getSession: (...args: unknown[]) => mockGetSession(...args) },
  },
}))

vi.mock('@/lib/core/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))

const mockTournamentFindUnique = vi.fn()
const mockRegistrationFindMany = vi.fn()
vi.mock('@/lib/core/prisma', () => ({
  default: {
    tournament: {
      findUnique: (...args: unknown[]) => mockTournamentFindUnique(...args),
    },
    tournamentRegistration: {
      findMany: (...args: unknown[]) => mockRegistrationFindMany(...args),
    },
  },
}))

const { GET } = await import(
  '@/app/api/admin/tournaments/[id]/export-csv/route'
)

const TOURNAMENT_ID = 'tournament-uuid-1'

const makeRequest = () =>
  new Request('http://localhost:3000/api/admin/tournaments/test/export-csv')

const makeParams = (id = TOURNAMENT_ID) => Promise.resolve({ id })

const adminSession = () => ({
  user: { id: 'u1', email: 'admin@test.com', name: 'Admin', role: Role.ADMIN },
  session: {
    id: 's1',
    userId: 'u1',
    token: 'tok',
    expiresAt: new Date().toISOString(),
  },
})

const userSession = () => ({
  user: { id: 'u2', email: 'user@test.com', name: 'User', role: Role.USER },
  session: {
    id: 's2',
    userId: 'u2',
    token: 'tok2',
    expiresAt: new Date().toISOString(),
  },
})

describe('GET /api/admin/tournaments/[id]/export-csv', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when no session exists', async () => {
    mockGetSession.mockResolvedValue(null)

    const response = await GET(makeRequest(), { params: makeParams() })

    expect(response.status).toBe(401)
  })

  it('returns 401 when user has role USER', async () => {
    mockGetSession.mockResolvedValue(userSession())

    const response = await GET(makeRequest(), { params: makeParams() })

    expect(response.status).toBe(401)
  })

  it('returns 404 when tournament does not exist', async () => {
    mockGetSession.mockResolvedValue(adminSession())
    mockTournamentFindUnique.mockResolvedValue(null)

    const response = await GET(makeRequest(), { params: makeParams() })

    expect(response.status).toBe(404)
  })

  it('returns a solo CSV for admins', async () => {
    mockGetSession.mockResolvedValue(adminSession())
    mockTournamentFindUnique.mockResolvedValue({
      slug: 'valorant-cup',
      format: 'SOLO',
      fields: [
        { label: 'Rang', order: 0 },
        { label: 'Agent principal', order: 1 },
      ],
    })
    mockRegistrationFindMany.mockResolvedValue([
      {
        fieldValues: { Rang: 'Diamond', 'Agent principal': 'Jett' },
        user: {
          name: 'player1',
          displayName: 'Player One',
          email: 'p1@test.com',
        },
        team: null,
      },
    ])

    const response = await GET(makeRequest(), { params: makeParams() })
    const csv = await response.text()

    expect(response.status).toBe(200)
    expect(csv).toContain('Pseudo,Nom Discord,Email,Rang,Agent principal')
    expect(csv).toContain('Player One,player1,p1@test.com,Diamond,Jett')
  })

  it('returns a team CSV with Equipe column for admins', async () => {
    mockGetSession.mockResolvedValue(adminSession())
    mockTournamentFindUnique.mockResolvedValue({
      slug: 'rl-championship',
      format: 'TEAM',
      fields: [{ label: 'Rang', order: 0 }],
    })
    mockRegistrationFindMany.mockResolvedValue([
      {
        fieldValues: { Rang: 'GC1' },
        user: {
          name: 'captain1',
          displayName: 'Captain One',
          email: 'c1@test.com',
        },
        team: { name: 'Team Alpha' },
      },
    ])

    const response = await GET(makeRequest(), { params: makeParams() })
    const csv = await response.text()

    expect(response.status).toBe(200)
    expect(csv).toContain('Equipe,Pseudo,Nom Discord,Email,Rang')
    expect(csv).toContain('Team Alpha,Captain One,captain1,c1@test.com,GC1')
  })
})
