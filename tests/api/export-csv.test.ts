/**
 * File: tests/api/export-csv.test.ts
 * Description: Unit tests for the CSV export API route (Toornament-compatible tournament registration export).
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
const mockAssignmentFindUnique = vi.fn()
vi.mock('@/lib/core/prisma', () => ({
  default: {
    tournament: {
      findUnique: (...args: unknown[]) => mockTournamentFindUnique(...args),
    },
    tournamentRegistration: {
      findMany: (...args: unknown[]) => mockRegistrationFindMany(...args),
    },
    adminAssignment: {
      findUnique: (...args: unknown[]) => mockAssignmentFindUnique(...args),
    },
  },
}))

// ---------------------------------------------------------------------------
// Module under test
// ---------------------------------------------------------------------------

const { GET } = await import(
  '@/app/api/admin/tournaments/[id]/export-csv/route'
)

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const TOURNAMENT_ID = 'tournament-uuid-1'

const makeRequest = () =>
  new Request('http://localhost:3000/api/admin/tournaments/test/export-csv')

const makeParams = (id = TOURNAMENT_ID) => Promise.resolve({ id })

const superadminSession = () => ({
  user: {
    id: 'u1',
    email: 'super@test.com',
    name: 'Super',
    role: Role.SUPERADMIN,
  },
  session: {
    id: 's1',
    userId: 'u1',
    token: 'tok',
    expiresAt: new Date().toISOString(),
  },
})

const adminSession = () => ({
  user: { id: 'u2', email: 'admin@test.com', name: 'Admin', role: Role.ADMIN },
  session: {
    id: 's2',
    userId: 'u2',
    token: 'tok',
    expiresAt: new Date().toISOString(),
  },
})

const userSession = () => ({
  user: { id: 'u3', email: 'user@test.com', name: 'User', role: Role.USER },
  session: {
    id: 's3',
    userId: 'u3',
    token: 'tok',
    expiresAt: new Date().toISOString(),
  },
})

const MOCK_TOURNAMENT_SOLO = {
  slug: 'valorant-cup',
  format: 'SOLO',
  fields: [
    { label: 'Rang', order: 0 },
    { label: 'Agent principal', order: 1 },
  ],
}

const MOCK_TOURNAMENT_TEAM = {
  slug: 'rl-championship',
  format: 'TEAM',
  fields: [{ label: 'Rang', order: 0 }],
}

const MOCK_REGISTRATIONS_SOLO = [
  {
    status: 'APPROVED',
    fieldValues: { Rang: 'Diamond', 'Agent principal': 'Jett' },
    user: { name: 'player1', displayName: 'Player One', email: 'p1@test.com' },
    team: null,
  },
  {
    status: 'PENDING',
    fieldValues: { Rang: 'Gold', 'Agent principal': 'Sage' },
    user: { name: 'player2', displayName: 'Player Two', email: 'p2@test.com' },
    team: null,
  },
]

const MOCK_REGISTRATIONS_TEAM = [
  {
    status: 'APPROVED',
    fieldValues: { Rang: 'GC1' },
    user: {
      name: 'captain1',
      displayName: 'Captain One',
      email: 'c1@test.com',
    },
    team: { name: 'Team Alpha' },
  },
  {
    status: 'APPROVED',
    fieldValues: { Rang: 'C3' },
    user: { name: 'member1', displayName: 'Member One', email: 'm1@test.com' },
    team: { name: 'Team Alpha' },
  },
]

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('GET /api/admin/tournaments/[id]/export-csv', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // -----------------------------------------------------------------------
  // Auth
  // -----------------------------------------------------------------------

  describe('authentication & authorization', () => {
    it('returns 401 when no session exists', async () => {
      mockGetSession.mockResolvedValue(null)

      const response = await GET(makeRequest(), { params: makeParams() })

      expect(response.status).toBe(401)
      const body = await response.json()
      expect(body.error).toBe('Unauthorized')
    })

    it('returns 401 when user has role USER', async () => {
      mockGetSession.mockResolvedValue(userSession())

      const response = await GET(makeRequest(), { params: makeParams() })

      expect(response.status).toBe(401)
    })

    it('allows SUPERADMIN without assignment check', async () => {
      mockGetSession.mockResolvedValue(superadminSession())
      mockTournamentFindUnique.mockResolvedValue(MOCK_TOURNAMENT_SOLO)
      mockRegistrationFindMany.mockResolvedValue([])

      const response = await GET(makeRequest(), { params: makeParams() })

      expect(response.status).toBe(200)
      expect(mockAssignmentFindUnique).not.toHaveBeenCalled()
    })

    it('allows ADMIN with valid tournament assignment', async () => {
      mockGetSession.mockResolvedValue(adminSession())
      mockAssignmentFindUnique.mockResolvedValue({ id: 'a1' })
      mockTournamentFindUnique.mockResolvedValue(MOCK_TOURNAMENT_SOLO)
      mockRegistrationFindMany.mockResolvedValue([])

      const response = await GET(makeRequest(), { params: makeParams() })

      expect(response.status).toBe(200)
      expect(mockAssignmentFindUnique).toHaveBeenCalledWith({
        where: {
          adminId_tournamentId: {
            adminId: 'u2',
            tournamentId: TOURNAMENT_ID,
          },
        },
      })
    })

    it('returns 401 when ADMIN is not assigned to the tournament', async () => {
      mockGetSession.mockResolvedValue(adminSession())
      mockAssignmentFindUnique.mockResolvedValue(null)

      const response = await GET(makeRequest(), { params: makeParams() })

      expect(response.status).toBe(401)
    })
  })

  // -----------------------------------------------------------------------
  // Tournament lookup
  // -----------------------------------------------------------------------

  describe('tournament lookup', () => {
    it('returns 404 when tournament does not exist', async () => {
      mockGetSession.mockResolvedValue(superadminSession())
      mockTournamentFindUnique.mockResolvedValue(null)

      const response = await GET(makeRequest(), { params: makeParams() })

      expect(response.status).toBe(404)
      const body = await response.json()
      expect(body.error).toBe('Tournoi introuvable.')
    })
  })

  // -----------------------------------------------------------------------
  // CSV output — SOLO format
  // -----------------------------------------------------------------------

  describe('CSV output — SOLO format', () => {
    beforeEach(() => {
      mockGetSession.mockResolvedValue(superadminSession())
      mockTournamentFindUnique.mockResolvedValue(MOCK_TOURNAMENT_SOLO)
      mockRegistrationFindMany.mockResolvedValue(MOCK_REGISTRATIONS_SOLO)
    })

    it('returns a CSV response with correct content-type and disposition', async () => {
      const response = await GET(makeRequest(), { params: makeParams() })

      expect(response.status).toBe(200)
      expect(response.headers.get('Content-Type')).toBe(
        'text/csv; charset=utf-8',
      )
      expect(response.headers.get('Content-Disposition')).toBe(
        'attachment; filename="valorant-cup-inscriptions.csv"',
      )
    })

    it('starts with UTF-8 BOM', async () => {
      const response = await GET(makeRequest(), { params: makeParams() })
      const buffer = await response.arrayBuffer()
      const bytes = new Uint8Array(buffer)

      // UTF-8 BOM is 0xEF 0xBB 0xBF
      expect(bytes[0]).toBe(0xef)
      expect(bytes[1]).toBe(0xbb)
      expect(bytes[2]).toBe(0xbf)
    })

    it('does not include Equipe column for SOLO format', async () => {
      const response = await GET(makeRequest(), { params: makeParams() })
      const text = await response.text()
      const headerRow = text.replace('\uFEFF', '').split('\r\n')[0]

      expect(headerRow).toBe(
        'Pseudo,Nom Discord,Email,Statut,Rang,Agent principal',
      )
    })

    it('includes all registration rows with correct data', async () => {
      const response = await GET(makeRequest(), { params: makeParams() })
      const text = await response.text()
      const lines = text.replace('\uFEFF', '').split('\r\n')

      expect(lines).toHaveLength(3) // header + 2 registrations
      expect(lines[1]).toBe(
        'Player One,player1,p1@test.com,APPROVED,Diamond,Jett',
      )
      expect(lines[2]).toBe('Player Two,player2,p2@test.com,PENDING,Gold,Sage')
    })
  })

  // -----------------------------------------------------------------------
  // CSV output — TEAM format
  // -----------------------------------------------------------------------

  describe('CSV output — TEAM format', () => {
    beforeEach(() => {
      mockGetSession.mockResolvedValue(superadminSession())
      mockTournamentFindUnique.mockResolvedValue(MOCK_TOURNAMENT_TEAM)
      mockRegistrationFindMany.mockResolvedValue(MOCK_REGISTRATIONS_TEAM)
    })

    it('includes Equipe column for TEAM format', async () => {
      const response = await GET(makeRequest(), { params: makeParams() })
      const text = await response.text()
      const headerRow = text.replace('\uFEFF', '').split('\r\n')[0]

      expect(headerRow).toBe('Equipe,Pseudo,Nom Discord,Email,Statut,Rang')
    })

    it('includes team name in each row', async () => {
      const response = await GET(makeRequest(), { params: makeParams() })
      const text = await response.text()
      const lines = text.replace('\uFEFF', '').split('\r\n')

      expect(lines).toHaveLength(3)
      expect(lines[1]).toBe(
        'Team Alpha,Captain One,captain1,c1@test.com,APPROVED,GC1',
      )
      expect(lines[2]).toBe(
        'Team Alpha,Member One,member1,m1@test.com,APPROVED,C3',
      )
    })

    it('uses slug for filename', async () => {
      const response = await GET(makeRequest(), { params: makeParams() })

      expect(response.headers.get('Content-Disposition')).toBe(
        'attachment; filename="rl-championship-inscriptions.csv"',
      )
    })
  })

  // -----------------------------------------------------------------------
  // CSV escaping
  // -----------------------------------------------------------------------

  describe('CSV escaping', () => {
    it('escapes field values containing commas', async () => {
      mockGetSession.mockResolvedValue(superadminSession())
      mockTournamentFindUnique.mockResolvedValue({
        slug: 'test',
        format: 'SOLO',
        fields: [],
      })
      mockRegistrationFindMany.mockResolvedValue([
        {
          status: 'APPROVED',
          fieldValues: {},
          user: {
            name: 'user,name',
            displayName: 'Display, Name',
            email: 'a@b.com',
          },
          team: null,
        },
      ])

      const response = await GET(makeRequest(), { params: makeParams() })
      const text = await response.text()
      const dataRow = text.replace('\uFEFF', '').split('\r\n')[1]

      expect(dataRow).toBe('"Display, Name","user,name",a@b.com,APPROVED')
    })

    it('escapes field values containing double quotes', async () => {
      mockGetSession.mockResolvedValue(superadminSession())
      mockTournamentFindUnique.mockResolvedValue({
        slug: 'test',
        format: 'SOLO',
        fields: [],
      })
      mockRegistrationFindMany.mockResolvedValue([
        {
          status: 'APPROVED',
          fieldValues: {},
          user: { name: 'user"name', displayName: 'Display', email: 'a@b.com' },
          team: null,
        },
      ])

      const response = await GET(makeRequest(), { params: makeParams() })
      const text = await response.text()
      const dataRow = text.replace('\uFEFF', '').split('\r\n')[1]

      expect(dataRow).toBe('Display,"user""name",a@b.com,APPROVED')
    })
  })

  // -----------------------------------------------------------------------
  // Edge cases
  // -----------------------------------------------------------------------

  describe('edge cases', () => {
    it('returns empty CSV (header only) when no registrations exist', async () => {
      mockGetSession.mockResolvedValue(superadminSession())
      mockTournamentFindUnique.mockResolvedValue(MOCK_TOURNAMENT_SOLO)
      mockRegistrationFindMany.mockResolvedValue([])

      const response = await GET(makeRequest(), { params: makeParams() })
      const text = await response.text()
      const lines = text.replace('\uFEFF', '').split('\r\n')

      expect(lines).toHaveLength(1) // header only
    })

    it('handles missing field values gracefully', async () => {
      mockGetSession.mockResolvedValue(superadminSession())
      mockTournamentFindUnique.mockResolvedValue(MOCK_TOURNAMENT_SOLO)
      mockRegistrationFindMany.mockResolvedValue([
        {
          status: 'PENDING',
          fieldValues: { Rang: 'Silver' },
          user: { name: 'player', displayName: 'Player', email: 'p@test.com' },
          team: null,
        },
      ])

      const response = await GET(makeRequest(), { params: makeParams() })
      const text = await response.text()
      const dataRow = text.replace('\uFEFF', '').split('\r\n')[1]

      // "Agent principal" field is missing from fieldValues, should be empty string
      expect(dataRow).toBe('Player,player,p@test.com,PENDING,Silver,')
    })

    it('handles null fieldValues gracefully', async () => {
      mockGetSession.mockResolvedValue(superadminSession())
      mockTournamentFindUnique.mockResolvedValue({
        slug: 'test',
        format: 'SOLO',
        fields: [{ label: 'Rang', order: 0 }],
      })
      mockRegistrationFindMany.mockResolvedValue([
        {
          status: 'PENDING',
          fieldValues: null,
          user: { name: 'player', displayName: 'Player', email: 'p@test.com' },
          team: null,
        },
      ])

      const response = await GET(makeRequest(), { params: makeParams() })
      const text = await response.text()
      const dataRow = text.replace('\uFEFF', '').split('\r\n')[1]

      expect(dataRow).toBe('Player,player,p@test.com,PENDING,')
    })

    it('returns 500 when Prisma throws', async () => {
      mockGetSession.mockResolvedValue(superadminSession())
      mockTournamentFindUnique.mockRejectedValue(new Error('DB down'))

      const response = await GET(makeRequest(), { params: makeParams() })

      expect(response.status).toBe(500)
      const body = await response.json()
      expect(body.error).toBe("Erreur lors de l'export CSV.")
    })
  })
})
