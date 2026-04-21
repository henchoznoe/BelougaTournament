/**
 * File: tests/actions/tournament-team.test.ts
 * Description: Unit tests for tournament-team server actions (kick, dissolve, rename).
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  PaymentStatus,
  RegistrationStatus,
  Role,
  TournamentStatus,
} from '@/prisma/generated/prisma/enums'

vi.mock('server-only', () => ({}))

const mockGetSession = vi.fn()
vi.mock('@/lib/core/auth', () => ({
  default: {
    api: { getSession: (...args: unknown[]) => mockGetSession(...args) },
  },
}))

vi.mock('next/headers', () => ({
  headers: vi.fn().mockResolvedValue(new Headers()),
}))

vi.mock('@/lib/core/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))

vi.mock('next/cache', () => ({
  revalidateTag: vi.fn(),
  updateTag: vi.fn(),
  cacheLife: vi.fn(),
  cacheTag: vi.fn(),
}))

const mockRegistrationFindUnique = vi.fn()
const mockRegistrationFindMany = vi.fn()
const mockTeamFindUnique = vi.fn()
const mockTeamFindFirst = vi.fn()
const mockTournamentFindUnique = vi.fn()

const mockTxTeamMemberDeleteMany = vi.fn()
const mockTxRegistrationDeleteMany = vi.fn()
const mockTxRegistrationUpdate = vi.fn()
const mockTxRegistrationDelete = vi.fn()
const mockTxTeamDelete = vi.fn()
const mockTxTeamUpdate = vi.fn()
const mockTxTeamMemberCount = vi.fn()

const mockTx = {
  teamMember: {
    deleteMany: (...args: unknown[]) => mockTxTeamMemberDeleteMany(...args),
    count: (...args: unknown[]) => mockTxTeamMemberCount(...args),
  },
  tournamentRegistration: {
    deleteMany: (...args: unknown[]) => mockTxRegistrationDeleteMany(...args),
    delete: (...args: unknown[]) => mockTxRegistrationDelete(...args),
    update: (...args: unknown[]) => mockTxRegistrationUpdate(...args),
  },
  team: {
    delete: (...args: unknown[]) => mockTxTeamDelete(...args),
    update: (...args: unknown[]) => mockTxTeamUpdate(...args),
  },
}

const mockTransaction = vi.fn(
  async (cb: (tx: typeof mockTx) => Promise<void>) => {
    await cb(mockTx)
  },
)

vi.mock('@/lib/core/prisma', () => ({
  default: {
    tournamentRegistration: {
      findUnique: (...args: unknown[]) => mockRegistrationFindUnique(...args),
      findMany: (...args: unknown[]) => mockRegistrationFindMany(...args),
    },
    team: {
      findUnique: (...args: unknown[]) => mockTeamFindUnique(...args),
      findFirst: (...args: unknown[]) => mockTeamFindFirst(...args),
      update: (...args: unknown[]) => mockTxTeamUpdate(...args),
    },
    tournament: {
      findUnique: (...args: unknown[]) => mockTournamentFindUnique(...args),
    },
    $transaction: (...args: unknown[]) => mockTransaction(...(args as [never])),
  },
}))

const { kickPlayer, dissolveTeam, updateTeamName } = await import(
  '@/lib/actions/tournament-team'
)

const TOURN_UUID = 'c2eec399-9c0b-4ef8-bb6d-6bb9bd380a33'
const TEAM_UUID = 'd3ffd499-9c0b-4ef8-bb6d-6bb9bd380a44'
const USER_UUID = 'b1ffc299-9c0b-4ef8-bb6d-6bb9bd380a22'
const CAPTAIN_UUID = 'aa11c299-9c0b-4ef8-bb6d-6bb9bd380a22'

const ADMIN_SESSION = {
  user: {
    id: 'admin-1',
    role: Role.ADMIN,
    email: 'admin@test.com',
    name: 'Admin',
  },
  session: {
    id: 'sess-1',
    userId: 'admin-1',
    token: 'tok',
    expiresAt: '2027-01-01',
  },
}

const USER_SESSION = {
  user: {
    id: CAPTAIN_UUID,
    role: Role.USER,
    email: 'user@test.com',
    name: 'Captain',
  },
  session: {
    id: 'sess-2',
    userId: CAPTAIN_UUID,
    token: 'tok2',
    expiresAt: '2027-01-01',
  },
}

describe('tournament-team actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockTxTeamMemberCount.mockResolvedValue(1)
  })

  // ---------------------------------------------------------------------------
  // kickPlayer
  // ---------------------------------------------------------------------------

  describe('kickPlayer', () => {
    it('rejects non-admin users', async () => {
      mockGetSession.mockResolvedValue(USER_SESSION)

      expect(
        await kickPlayer({
          teamId: TEAM_UUID,
          tournamentId: TOURN_UUID,
          userId: USER_UUID,
        }),
      ).toEqual({
        success: false,
        message: 'Unauthorized',
      })
    })

    it('returns error when team not found', async () => {
      mockGetSession.mockResolvedValue(ADMIN_SESSION)
      mockTeamFindUnique.mockResolvedValue(null)

      expect(
        await kickPlayer({
          teamId: TEAM_UUID,
          tournamentId: TOURN_UUID,
          userId: USER_UUID,
        }),
      ).toEqual({
        success: false,
        message: 'Équipe introuvable.',
      })
    })

    it('returns error when user is not a team member', async () => {
      mockGetSession.mockResolvedValue(ADMIN_SESSION)
      mockTeamFindUnique.mockResolvedValue({
        id: TEAM_UUID,
        tournamentId: TOURN_UUID,
        captainId: CAPTAIN_UUID,
        tournament: { teamSize: 2 },
        members: [{ userId: CAPTAIN_UUID }],
      })

      expect(
        await kickPlayer({
          teamId: TEAM_UUID,
          tournamentId: TOURN_UUID,
          userId: USER_UUID,
        }),
      ).toEqual({
        success: false,
        message: "Ce joueur ne fait pas partie de l'équipe.",
      })
    })

    it('kicks a non-captain player (free registration)', async () => {
      mockGetSession.mockResolvedValue(ADMIN_SESSION)
      mockTeamFindUnique.mockResolvedValue({
        id: TEAM_UUID,
        tournamentId: TOURN_UUID,
        captainId: CAPTAIN_UUID,
        tournament: { teamSize: 2 },
        members: [{ userId: CAPTAIN_UUID }, { userId: USER_UUID }],
      })
      mockRegistrationFindUnique.mockResolvedValue({
        id: 'reg-1',
        paymentRequiredSnapshot: false,
        paymentStatus: PaymentStatus.NOT_REQUIRED,
      })

      expect(
        await kickPlayer({
          teamId: TEAM_UUID,
          tournamentId: TOURN_UUID,
          userId: USER_UUID,
        }),
      ).toEqual({
        success: true,
        message: "Le joueur a été retiré de l'équipe.",
      })
      expect(mockTxTeamMemberDeleteMany).toHaveBeenCalledOnce()
      expect(mockTxRegistrationDeleteMany).toHaveBeenCalledOnce()
    })

    it('cancels (not deletes) registration when payment was required', async () => {
      mockGetSession.mockResolvedValue(ADMIN_SESSION)
      mockTeamFindUnique.mockResolvedValue({
        id: TEAM_UUID,
        tournamentId: TOURN_UUID,
        captainId: CAPTAIN_UUID,
        tournament: { teamSize: 2 },
        members: [{ userId: CAPTAIN_UUID }, { userId: USER_UUID }],
      })
      mockRegistrationFindUnique.mockResolvedValue({
        id: 'reg-1',
        paymentRequiredSnapshot: true,
        paymentStatus: PaymentStatus.PAID,
      })

      expect(
        await kickPlayer({
          teamId: TEAM_UUID,
          tournamentId: TOURN_UUID,
          userId: USER_UUID,
        }),
      ).toEqual({
        success: true,
        message: "Le joueur a été retiré de l'équipe.",
      })
      expect(mockTxRegistrationUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: RegistrationStatus.CANCELLED,
          }),
        }),
      )
      expect(mockTxRegistrationDeleteMany).not.toHaveBeenCalled()
    })
  })

  // ---------------------------------------------------------------------------
  // dissolveTeam
  // ---------------------------------------------------------------------------

  describe('dissolveTeam', () => {
    it('rejects non-admin users', async () => {
      mockGetSession.mockResolvedValue(USER_SESSION)

      expect(
        await dissolveTeam({ teamId: TEAM_UUID, tournamentId: TOURN_UUID }),
      ).toEqual({
        success: false,
        message: 'Unauthorized',
      })
    })

    it('returns error when team not found', async () => {
      mockGetSession.mockResolvedValue(ADMIN_SESSION)
      mockTeamFindUnique.mockResolvedValue(null)

      expect(
        await dissolveTeam({ teamId: TEAM_UUID, tournamentId: TOURN_UUID }),
      ).toEqual({
        success: false,
        message: 'Équipe introuvable.',
      })
    })

    it('dissolves a team with free registrations', async () => {
      mockGetSession.mockResolvedValue(ADMIN_SESSION)
      mockTeamFindUnique.mockResolvedValue({
        id: TEAM_UUID,
        tournamentId: TOURN_UUID,
        members: [{ userId: CAPTAIN_UUID }, { userId: USER_UUID }],
      })
      mockRegistrationFindMany.mockResolvedValue([
        {
          id: 'reg-1',
          userId: CAPTAIN_UUID,
          paymentRequiredSnapshot: false,
          paymentStatus: PaymentStatus.NOT_REQUIRED,
        },
        {
          id: 'reg-2',
          userId: USER_UUID,
          paymentRequiredSnapshot: false,
          paymentStatus: PaymentStatus.NOT_REQUIRED,
        },
      ])

      expect(
        await dissolveTeam({ teamId: TEAM_UUID, tournamentId: TOURN_UUID }),
      ).toEqual({
        success: true,
        message: "L'équipe a été dissoute.",
      })
      expect(mockTxTeamDelete).toHaveBeenCalledOnce()
    })

    it('cancels paid registrations when dissolving a team', async () => {
      mockGetSession.mockResolvedValue(ADMIN_SESSION)
      mockTeamFindUnique.mockResolvedValue({
        id: TEAM_UUID,
        tournamentId: TOURN_UUID,
        members: [{ userId: CAPTAIN_UUID }],
      })
      mockRegistrationFindMany.mockResolvedValue([
        {
          id: 'reg-1',
          userId: CAPTAIN_UUID,
          paymentRequiredSnapshot: true,
          paymentStatus: PaymentStatus.PAID,
        },
      ])

      expect(
        await dissolveTeam({ teamId: TEAM_UUID, tournamentId: TOURN_UUID }),
      ).toEqual({
        success: true,
        message: "L'équipe a été dissoute.",
      })
      expect(mockTxRegistrationUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: RegistrationStatus.CANCELLED,
          }),
        }),
      )
      expect(mockTxRegistrationDelete).not.toHaveBeenCalled()
    })
  })

  // ---------------------------------------------------------------------------
  // updateTeamName (captain only)
  // ---------------------------------------------------------------------------

  describe('updateTeamName', () => {
    it('rejects a non-captain user', async () => {
      mockGetSession.mockResolvedValue(USER_SESSION)
      mockTeamFindUnique.mockResolvedValue({
        id: TEAM_UUID,
        captainId: 'someone-else',
        tournamentId: TOURN_UUID,
      })

      expect(
        await updateTeamName({ teamId: TEAM_UUID, name: 'New Name' }),
      ).toEqual({
        success: false,
        message: "Seul le capitaine peut renommer l'équipe.",
      })
    })

    it('rejects rename when tournament is not published', async () => {
      mockGetSession.mockResolvedValue(USER_SESSION)
      mockTeamFindUnique.mockResolvedValue({
        id: TEAM_UUID,
        captainId: CAPTAIN_UUID,
        tournamentId: TOURN_UUID,
      })
      mockTournamentFindUnique.mockResolvedValue({
        status: TournamentStatus.ARCHIVED,
      })

      expect(
        await updateTeamName({ teamId: TEAM_UUID, name: 'New Name' }),
      ).toEqual({
        success: false,
        message: 'Ce tournoi ne permet plus de modifications.',
      })
    })

    it('rejects rename when team name is already taken', async () => {
      mockGetSession.mockResolvedValue(USER_SESSION)
      mockTeamFindUnique.mockResolvedValue({
        id: TEAM_UUID,
        captainId: CAPTAIN_UUID,
        tournamentId: TOURN_UUID,
      })
      mockTournamentFindUnique.mockResolvedValue({
        status: TournamentStatus.PUBLISHED,
      })
      mockTeamFindFirst.mockResolvedValue({ id: 'other-team' }) // duplicate found

      expect(
        await updateTeamName({ teamId: TEAM_UUID, name: 'Taken Name' }),
      ).toEqual({
        success: false,
        message: "Ce nom d'équipe est déjà pris dans ce tournoi.",
      })
    })

    it('renames the team when captain and name is available', async () => {
      mockGetSession.mockResolvedValue(USER_SESSION)
      mockTeamFindUnique.mockResolvedValue({
        id: TEAM_UUID,
        captainId: CAPTAIN_UUID,
        tournamentId: TOURN_UUID,
      })
      mockTournamentFindUnique.mockResolvedValue({
        status: TournamentStatus.PUBLISHED,
      })
      mockTeamFindFirst.mockResolvedValue(null) // no duplicate

      expect(
        await updateTeamName({ teamId: TEAM_UUID, name: 'Fresh Name' }),
      ).toEqual({
        success: true,
        message: "Le nom de l'équipe a été mis à jour.",
      })
      expect(mockTxTeamUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ data: { name: 'Fresh Name' } }),
      )
    })
  })
})
