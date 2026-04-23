/**
 * File: tests/actions/tournaments.test.ts
 * Description: Unit tests for tournament admin actions.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  DonationType,
  RefundPolicyType,
  RegistrationType,
  Role,
  TournamentFormat,
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

vi.mock('@/lib/core/env', () => ({
  env: {
    NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
  },
}))

vi.mock('@/lib/core/stripe', () => ({
  REGISTRATION_HOLD_MINUTES: 15,
  getStripe: vi.fn(),
}))

vi.mock('next/cache', () => ({
  revalidateTag: vi.fn(),
  updateTag: vi.fn(),
  cacheLife: vi.fn(),
  cacheTag: vi.fn(),
}))

const mockTournamentCreate = vi.fn()
const mockTournamentUpdate = vi.fn()
const mockTournamentDelete = vi.fn()
const mockTournamentFindUnique = vi.fn()
const mockFieldDeleteMany = vi.fn()
const mockTeamFindUnique = vi.fn()
const mockTeamUpdate = vi.fn()
const mockTeamDelete = vi.fn()
const mockTeamMemberDeleteMany = vi.fn()
const mockTeamMemberCount = vi.fn()
const mockRegistrationFindUnique = vi.fn()
const mockRegistrationFindMany = vi.fn()
const mockRegistrationDelete = vi.fn()
const mockRegistrationDeleteMany = vi.fn()
const mockRegistrationCount = vi.fn()
const mockTransaction = vi.fn()

vi.mock('@/lib/core/prisma', () => ({
  default: {
    tournament: {
      create: (...args: unknown[]) => mockTournamentCreate(...args),
      update: (...args: unknown[]) => mockTournamentUpdate(...args),
      delete: (...args: unknown[]) => mockTournamentDelete(...args),
      findUnique: (...args: unknown[]) => mockTournamentFindUnique(...args),
    },
    tournamentField: {
      deleteMany: (...args: unknown[]) => mockFieldDeleteMany(...args),
    },
    toornamentStage: {
      deleteMany: (...args: unknown[]) => mockFieldDeleteMany(...args),
    },
    team: {
      findUnique: (...args: unknown[]) => mockTeamFindUnique(...args),
      update: (...args: unknown[]) => mockTeamUpdate(...args),
      delete: (...args: unknown[]) => mockTeamDelete(...args),
    },
    teamMember: {
      deleteMany: (...args: unknown[]) => mockTeamMemberDeleteMany(...args),
      count: (...args: unknown[]) => mockTeamMemberCount(...args),
    },
    tournamentRegistration: {
      findUnique: (...args: unknown[]) => mockRegistrationFindUnique(...args),
      findMany: (...args: unknown[]) => mockRegistrationFindMany(...args),
      deleteMany: (...args: unknown[]) => mockRegistrationDeleteMany(...args),
      count: (...args: unknown[]) => mockRegistrationCount(...args),
    },
    $transaction: (...args: unknown[]) => mockTransaction(...args),
  },
}))

const {
  createTournament,
  updateTournament,
  deleteTournament,
  updateTournamentStatus,
} = await import('@/lib/actions/tournaments')

const { kickPlayer, dissolveTeam } = await import(
  '@/lib/actions/tournament-team'
)

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
    id: 'user-1',
    role: Role.USER,
    email: 'user@test.com',
    name: 'User',
  },
  session: {
    id: 'sess-2',
    userId: 'user-1',
    token: 'tok2',
    expiresAt: '2027-01-01',
  },
}

const VALID_TOURNAMENT_INPUT = {
  title: 'Valorant Cup',
  slug: 'valorant-cup',
  description: 'Tournoi Valorant 5v5.',
  startDate: '2026-06-15T10:00:00.000Z',
  endDate: '2026-06-17T18:00:00.000Z',
  registrationOpen: '2026-05-01T00:00:00.000Z',
  registrationClose: '2026-06-14T23:59:00.000Z',
  maxTeams: 16,
  format: TournamentFormat.TEAM,
  teamSize: 5,
  games: ['Valorant'],
  rules: 'Double élimination BO3.',
  prize: '500 CHF',
  registrationType: RegistrationType.FREE,
  entryFeeAmount: null,
  entryFeeCurrency: 'CHF' as const,
  refundPolicyType: RefundPolicyType.NONE,
  refundDeadlineDays: null,
  teamLogoEnabled: false,
  toornamentId: '',
  streamUrl: '',
  imageUrls: [],
  fields: [
    { label: 'Riot ID', type: 'TEXT' as const, required: true, order: 0 },
  ],
  toornamentStages: [],
  donationEnabled: false,
}

const TOURNAMENT_UUID = '11111111-1111-4111-8111-111111111111'
const TEAM_UUID = '22222222-2222-4222-8222-222222222222'
const CAPTAIN_UUID = '33333333-3333-4333-8333-333333333333'
const MEMBER_UUID = '44444444-4444-4444-8444-444444444444'

const EXISTING_TOURNAMENT = {
  id: TOURNAMENT_UUID,
  slug: 'valorant-cup',
  format: TournamentFormat.TEAM,
  registrationType: RegistrationType.FREE,
  entryFeeAmount: null,
  entryFeeCurrency: 'CHF' as const,
  refundPolicyType: RefundPolicyType.NONE,
  refundDeadlineDays: null,
  status: TournamentStatus.DRAFT,
  fields: [],
  _count: { registrations: 0 },
}

const PAID_TOURNAMENT_INPUT = {
  ...VALID_TOURNAMENT_INPUT,
  registrationType: RegistrationType.PAID,
  entryFeeAmount: 1500,
  refundPolicyType: RefundPolicyType.BEFORE_DEADLINE,
  refundDeadlineDays: 7,
}

const EXISTING_PAID_TOURNAMENT = {
  ...EXISTING_TOURNAMENT,
  registrationType: RegistrationType.PAID,
  entryFeeAmount: 1500,
  entryFeeCurrency: 'CHF' as const,
  refundPolicyType: RefundPolicyType.BEFORE_DEADLINE,
  refundDeadlineDays: 7,
}

describe('tournament admin actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetSession.mockResolvedValue(ADMIN_SESSION)
    mockTournamentCreate.mockResolvedValue({})
    mockTournamentUpdate.mockResolvedValue({})
    mockTournamentDelete.mockResolvedValue({})
    mockTournamentFindUnique.mockResolvedValue(EXISTING_TOURNAMENT)
    mockTransaction.mockResolvedValue([])
    mockTeamMemberCount.mockResolvedValue(1)
    mockRegistrationCount.mockResolvedValue(0)
    mockRegistrationFindUnique.mockResolvedValue({
      id: 'reg-1',
      paymentRequiredSnapshot: false,
      paymentStatus: 'NOT_REQUIRED',
    })
    mockRegistrationFindMany.mockResolvedValue([
      {
        id: 'reg-1',
        userId: CAPTAIN_UUID,
        paymentRequiredSnapshot: false,
        paymentStatus: 'NOT_REQUIRED',
      },
      {
        id: 'reg-2',
        userId: MEMBER_UUID,
        paymentRequiredSnapshot: false,
        paymentStatus: 'NOT_REQUIRED',
      },
    ])
  })

  it('rejects non-admin users for createTournament', async () => {
    mockGetSession.mockResolvedValue(USER_SESSION)

    expect(await createTournament(VALID_TOURNAMENT_INPUT)).toEqual({
      success: false,
      message: 'Unauthorized',
    })
  })

  it('creates a tournament for admins', async () => {
    // Slug uniqueness check: no existing tournament with that slug
    mockTournamentFindUnique.mockResolvedValueOnce(null)
    const result = await createTournament(VALID_TOURNAMENT_INPUT)
    expect(result.success).toBe(true)
    expect(result.message).toBe('Le tournoi a été créé.')
    expect(result.data).toMatchObject({ slug: 'valorant-cup' })
    expect(mockTournamentCreate).toHaveBeenCalledOnce()
  })

  it('creates a tournament with a suffixed slug when the base slug is already taken', async () => {
    mockTournamentFindUnique
      .mockResolvedValueOnce({ id: 'existing-tournament' })
      .mockResolvedValueOnce(null)

    const result = await createTournament(VALID_TOURNAMENT_INPUT)

    expect(result.success).toBe(true)
    expect(result.data).toMatchObject({ slug: 'valorant-cup-2' })
  })

  it('creates a paid tournament with fixed donations configured', async () => {
    mockTournamentFindUnique.mockResolvedValueOnce(null)

    await createTournament({
      ...PAID_TOURNAMENT_INPUT,
      donationEnabled: true,
      donationType: DonationType.FIXED,
      donationFixedAmount: 300,
      donationMinAmount: null,
    })

    expect(mockTournamentCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          entryFeeCurrency: 'CHF',
          refundPolicyType: RefundPolicyType.BEFORE_DEADLINE,
          refundDeadlineDays: 7,
          donationEnabled: true,
          donationType: DonationType.FIXED,
          donationFixedAmount: 300,
          donationMinAmount: null,
        }),
      }),
    )
  })

  it('creates a paid tournament with free donations configured', async () => {
    mockTournamentFindUnique.mockResolvedValueOnce(null)

    await createTournament({
      ...PAID_TOURNAMENT_INPUT,
      donationEnabled: true,
      donationType: DonationType.FREE,
      donationFixedAmount: null,
      donationMinAmount: 200,
    })

    expect(mockTournamentCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          donationEnabled: true,
          donationType: DonationType.FREE,
          donationFixedAmount: null,
          donationMinAmount: 200,
        }),
      }),
    )
  })

  it('creates a paid tournament with donations disabled', async () => {
    mockTournamentFindUnique.mockResolvedValueOnce(null)

    await createTournament({
      ...PAID_TOURNAMENT_INPUT,
      donationEnabled: false,
      donationType: null,
      donationFixedAmount: null,
      donationMinAmount: null,
    })

    expect(mockTournamentCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          donationEnabled: false,
          donationType: null,
          donationFixedAmount: null,
          donationMinAmount: null,
        }),
      }),
    )
  })

  it('creates a tournament with Toornament stages when provided', async () => {
    mockTournamentFindUnique.mockResolvedValueOnce(null)

    await createTournament({
      ...VALID_TOURNAMENT_INPUT,
      toornamentId: 'stage-root-1',
      toornamentStages: [{ name: 'Groups', stageId: 'stage-1', number: 1 }],
    })

    expect(mockTournamentCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          toornamentStages: {
            create: [{ name: 'Groups', stageId: 'stage-1', number: 1 }],
          },
        }),
      }),
    )
  })

  it('updates a tournament for admins without assignment checks', async () => {
    expect(
      await updateTournament({
        ...VALID_TOURNAMENT_INPUT,
        id: TOURNAMENT_UUID,
      }),
    ).toEqual({ success: true, message: 'Le tournoi a été mis à jour.' })
    expect(mockTransaction).toHaveBeenCalledOnce()
  })

  it('updates a paid tournament with free donations configured', async () => {
    mockTournamentFindUnique.mockResolvedValue(EXISTING_PAID_TOURNAMENT)

    await updateTournament({
      ...PAID_TOURNAMENT_INPUT,
      id: TOURNAMENT_UUID,
      donationEnabled: true,
      donationType: DonationType.FREE,
      donationFixedAmount: null,
      donationMinAmount: 200,
    })

    expect(mockTransaction).toHaveBeenCalledOnce()
  })

  it('updates a paid tournament with fixed donations configured', async () => {
    mockTournamentFindUnique.mockResolvedValue(EXISTING_PAID_TOURNAMENT)

    await updateTournament({
      ...PAID_TOURNAMENT_INPUT,
      id: TOURNAMENT_UUID,
      donationEnabled: true,
      donationType: DonationType.FIXED,
      donationFixedAmount: 300,
      donationMinAmount: null,
    })

    expect(mockTournamentUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          donationEnabled: true,
          donationType: DonationType.FIXED,
          donationFixedAmount: 300,
          donationMinAmount: null,
        }),
      }),
    )
  })

  it('updates a paid tournament with donations disabled', async () => {
    mockTournamentFindUnique.mockResolvedValue(EXISTING_PAID_TOURNAMENT)

    await updateTournament({
      ...PAID_TOURNAMENT_INPUT,
      id: TOURNAMENT_UUID,
      donationEnabled: false,
      donationType: null,
      donationFixedAmount: null,
      donationMinAmount: null,
    })

    expect(mockTournamentUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          donationEnabled: false,
          donationType: null,
          donationFixedAmount: null,
          donationMinAmount: null,
        }),
      }),
    )
  })

  it('updates a tournament with Toornament stages when provided', async () => {
    mockTournamentFindUnique.mockResolvedValue(EXISTING_TOURNAMENT)

    await updateTournament({
      ...VALID_TOURNAMENT_INPUT,
      id: TOURNAMENT_UUID,
      toornamentId: 'stage-root-1',
      toornamentStages: [{ name: 'Groups', stageId: 'stage-1', number: 1 }],
    })

    expect(mockTournamentUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          toornamentStages: {
            create: [{ name: 'Groups', stageId: 'stage-1', number: 1 }],
          },
        }),
      }),
    )
  })

  it('returns an error when updating an unknown tournament', async () => {
    mockTournamentFindUnique.mockResolvedValue(null)

    expect(
      await updateTournament({
        ...VALID_TOURNAMENT_INPUT,
        id: TOURNAMENT_UUID,
      }),
    ).toEqual({ success: false, message: 'Tournoi introuvable.' })
  })

  it('rejects format changes after creation', async () => {
    expect(
      await updateTournament({
        ...VALID_TOURNAMENT_INPUT,
        id: TOURNAMENT_UUID,
        format: TournamentFormat.SOLO,
      }),
    ).toEqual({
      success: false,
      message:
        'Le format du tournoi ne peut pas être modifié après la création.',
    })
  })

  it('rejects registration type changes after creation', async () => {
    expect(
      await updateTournament({
        ...VALID_TOURNAMENT_INPUT,
        id: TOURNAMENT_UUID,
        registrationType: RegistrationType.PAID,
        entryFeeAmount: 1500,
        refundPolicyType: RefundPolicyType.BEFORE_DEADLINE,
        refundDeadlineDays: 7,
      }),
    ).toEqual({
      success: false,
      message:
        "Le mode d'inscription ne peut pas être modifié après la création.",
    })
  })

  it('rejects entry fee changes after creation', async () => {
    mockTournamentFindUnique.mockResolvedValue(EXISTING_PAID_TOURNAMENT)

    expect(
      await updateTournament({
        ...PAID_TOURNAMENT_INPUT,
        id: TOURNAMENT_UUID,
        entryFeeAmount: 2000,
      }),
    ).toEqual({
      success: false,
      message: "Le prix d'entrée ne peut pas être modifié après la création.",
    })
  })

  it('rejects entry fee currency changes for paid tournaments', async () => {
    mockTournamentFindUnique.mockResolvedValue({
      ...EXISTING_PAID_TOURNAMENT,
      entryFeeCurrency: 'EUR',
    })

    expect(
      await updateTournament({
        ...PAID_TOURNAMENT_INPUT,
        id: TOURNAMENT_UUID,
      }),
    ).toEqual({
      success: false,
      message:
        "La devise du prix d'entrée ne peut pas être modifiée après la création.",
    })
  })

  it('rejects refund policy changes after creation', async () => {
    mockTournamentFindUnique.mockResolvedValue(EXISTING_PAID_TOURNAMENT)

    expect(
      await updateTournament({
        ...PAID_TOURNAMENT_INPUT,
        id: TOURNAMENT_UUID,
        refundPolicyType: RefundPolicyType.NONE,
        refundDeadlineDays: null,
      }),
    ).toEqual({
      success: false,
      message:
        'La politique de remboursement ne peut pas être modifiée après la création.',
    })
  })

  it('rejects refund deadline changes after creation', async () => {
    mockTournamentFindUnique.mockResolvedValue(EXISTING_PAID_TOURNAMENT)

    expect(
      await updateTournament({
        ...PAID_TOURNAMENT_INPUT,
        id: TOURNAMENT_UUID,
        refundDeadlineDays: 14,
      }),
    ).toEqual({
      success: false,
      message:
        'Le délai de remboursement ne peut pas être modifié après la création.',
    })
  })

  it('rejects field changes when the tournament is published and already has registrations', async () => {
    mockTournamentFindUnique.mockResolvedValue({
      ...EXISTING_TOURNAMENT,
      status: TournamentStatus.PUBLISHED,
      fields: [{ label: 'Riot ID', type: 'TEXT', required: true, order: 0 }],
      _count: { registrations: 1 },
    })

    expect(
      await updateTournament({
        ...VALID_TOURNAMENT_INPUT,
        id: TOURNAMENT_UUID,
        fields: [
          { label: 'Discord', type: 'TEXT' as const, required: true, order: 0 },
        ],
      }),
    ).toEqual({
      success: false,
      message:
        'Les champs personnalisés ne peuvent pas être modifiés lorsque le tournoi est publié et a des inscriptions.',
    })
  })

  it('allows updates when a published tournament has registrations but the custom fields remain unchanged', async () => {
    mockTournamentFindUnique.mockResolvedValue({
      ...EXISTING_TOURNAMENT,
      status: TournamentStatus.PUBLISHED,
      fields: [{ label: 'Riot ID', type: 'TEXT', required: true, order: 0 }],
      _count: { registrations: 1 },
    })

    expect(
      await updateTournament({
        ...VALID_TOURNAMENT_INPUT,
        id: TOURNAMENT_UUID,
        fields: [
          { label: 'Riot ID', type: 'TEXT' as const, required: true, order: 0 },
        ],
      }),
    ).toEqual({ success: true, message: 'Le tournoi a été mis à jour.' })
  })

  it('updates tournament status for admins', async () => {
    expect(
      await updateTournamentStatus({
        id: TOURNAMENT_UUID,
        status: TournamentStatus.PUBLISHED,
      }),
    ).toEqual({
      success: true,
      message: 'Le statut du tournoi a été mis à jour.',
    })
  })

  it('rejects deleting a tournament that still has paid registrations', async () => {
    mockRegistrationCount.mockResolvedValueOnce(1)

    expect(await deleteTournament({ id: TOURNAMENT_UUID })).toEqual({
      success: false,
      message:
        "Impossible de supprimer ce tournoi : des inscriptions payées existent. Remboursez-les d'abord.",
    })
  })

  it('deletes a tournament for admins', async () => {
    expect(await deleteTournament({ id: TOURNAMENT_UUID })).toEqual({
      success: true,
      message: 'Le tournoi a été supprimé.',
    })
  })

  it('rejects moving a tournament back to draft when paid registrations exist', async () => {
    mockRegistrationCount.mockResolvedValueOnce(1)

    expect(
      await updateTournamentStatus({
        id: TOURNAMENT_UUID,
        status: TournamentStatus.DRAFT,
      }),
    ).toEqual({
      success: false,
      message:
        "Impossible de repasser en brouillon : des inscriptions payées existent. Remboursez-les d'abord.",
    })
  })

  it('allows moving a tournament back to draft when no paid registrations exist', async () => {
    mockRegistrationCount.mockResolvedValueOnce(0)

    expect(
      await updateTournamentStatus({
        id: TOURNAMENT_UUID,
        status: TournamentStatus.DRAFT,
      }),
    ).toEqual({
      success: true,
      message: 'Le statut du tournoi a été mis à jour.',
    })
  })
})

describe('team moderation actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetSession.mockResolvedValue(ADMIN_SESSION)
    mockTeamFindUnique.mockResolvedValue({
      id: TEAM_UUID,
      tournamentId: TOURNAMENT_UUID,
      captainId: CAPTAIN_UUID,
      tournament: { teamSize: 2 },
      members: [{ userId: CAPTAIN_UUID }, { userId: MEMBER_UUID }],
    })
    mockTransaction.mockImplementation(async callback =>
      callback({
        teamMember: {
          deleteMany: mockTeamMemberDeleteMany,
          count: mockTeamMemberCount,
        },
        tournamentRegistration: {
          delete: mockRegistrationDelete,
          deleteMany: mockRegistrationDeleteMany,
        },
        team: { update: mockTeamUpdate, delete: mockTeamDelete },
      }),
    )
  })

  it('kicks a player for admins', async () => {
    expect(
      await kickPlayer({
        teamId: TEAM_UUID,
        userId: MEMBER_UUID,
        tournamentId: TOURNAMENT_UUID,
      }),
    ).toEqual({ success: true, message: "Le joueur a été retiré de l'équipe." })
  })

  it('dissolves a team for admins', async () => {
    expect(
      await dissolveTeam({ teamId: TEAM_UUID, tournamentId: TOURNAMENT_UUID }),
    ).toEqual({ success: true, message: "L'équipe a été dissoute." })
  })
})
