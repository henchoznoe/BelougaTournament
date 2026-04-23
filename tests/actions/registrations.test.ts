/**
 * File: tests/actions/registrations.test.ts
 * Description: Unit tests for admin registration server actions.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  PaymentStatus,
  RegistrationStatus,
  Role,
  TournamentFormat,
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

const mockRefundCreate = vi.fn()
vi.mock('@/lib/core/stripe', () => ({
  getStripe: () => ({
    refunds: {
      create: (...args: unknown[]) => mockRefundCreate(...args),
    },
  }),
}))

vi.mock('next/cache', () => ({
  revalidateTag: vi.fn(),
  updateTag: vi.fn(),
  cacheLife: vi.fn(),
  cacheTag: vi.fn(),
}))

const mockRegistrationFindUnique = vi.fn()
const mockRegistrationDelete = vi.fn()
const mockRegistrationUpdate = vi.fn()
const mockTeamMemberFindFirst = vi.fn()
const mockTeamFindUnique = vi.fn()

const mockTxTeamMemberDeleteMany = vi.fn()
const mockTxTeamMemberCreate = vi.fn()
const mockTxTeamMemberCount = vi.fn()
const mockTxRegistrationDelete = vi.fn()
const mockTxRegistrationUpdate = vi.fn()
const mockTxTeamUpdate = vi.fn()
const mockTxTeamDelete = vi.fn()
const mockTxPaymentUpdate = vi.fn()

const mockTx = {
  teamMember: {
    deleteMany: (...args: unknown[]) => mockTxTeamMemberDeleteMany(...args),
    create: (...args: unknown[]) => mockTxTeamMemberCreate(...args),
    count: (...args: unknown[]) => mockTxTeamMemberCount(...args),
  },
  tournamentRegistration: {
    delete: (...args: unknown[]) => mockTxRegistrationDelete(...args),
    update: (...args: unknown[]) => mockTxRegistrationUpdate(...args),
  },
  team: {
    update: (...args: unknown[]) => mockTxTeamUpdate(...args),
    delete: (...args: unknown[]) => mockTxTeamDelete(...args),
  },
  payment: {
    update: (...args: unknown[]) => mockTxPaymentUpdate(...args),
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
      delete: (...args: unknown[]) => mockRegistrationDelete(...args),
      update: (...args: unknown[]) => mockRegistrationUpdate(...args),
    },
    payment: {
      update: (...args: unknown[]) => mockTxPaymentUpdate(...args),
    },
    teamMember: {
      findFirst: (...args: unknown[]) => mockTeamMemberFindFirst(...args),
    },
    team: {
      findUnique: (...args: unknown[]) => mockTeamFindUnique(...args),
      update: (...args: unknown[]) => mockTxTeamUpdate(...args),
    },
    $transaction: (...args: unknown[]) => mockTransaction(...(args as [never])),
  },
}))

const {
  adminDeleteRegistration,
  adminUpdateRegistrationFields,
  adminRefundRegistration,
} = await import('@/lib/actions/registrations')

const { adminChangeTeam, adminPromoteCaptain } = await import(
  '@/lib/actions/registrations-team'
)

const REG_UUID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
const USER_UUID = 'b1ffc299-9c0b-4ef8-bb6d-6bb9bd380a22'
const TOURN_UUID = 'c2eec399-9c0b-4ef8-bb6d-6bb9bd380a33'
const TEAM_UUID = 'd3ffd499-9c0b-4ef8-bb6d-6bb9bd380a44'
const TARGET_TEAM_UUID = 'f5fff699-9c0b-4ef8-bb6d-6bb9bd380a66'
const MEMBER_UUID = 'e4eee599-9c0b-4ef8-bb6d-6bb9bd380a55'
const TEAM_MEMBER_JOINED_AT = new Date('2026-01-10T10:00:00.000Z')
const SECOND_MEMBER_JOINED_AT = new Date('2026-01-11T10:00:00.000Z')

const ADMIN_SESSION = {
  user: {
    id: 'admin-1',
    role: Role.ADMIN,
    email: 'admin@test.com',
    name: 'Admin',
  },
  session: {
    id: 'sess-2',
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
    id: 'sess-3',
    userId: 'user-1',
    token: 'tok2',
    expiresAt: '2027-01-01',
  },
}

const createLatestPayment = (
  overrides: Partial<{
    id: string
    status: PaymentStatus
    amount: number
    stripeFee: number | null
    donationAmount: number | null
    stripePaymentIntentId: string | null
    stripeChargeId: string | null
  }> = {},
) => ({
  id: overrides.id ?? 'payment-1',
  status: overrides.status ?? PaymentStatus.PAID,
  amount: overrides.amount ?? 500,
  stripeFee: overrides.stripeFee === undefined ? null : overrides.stripeFee,
  donationAmount:
    overrides.donationAmount === undefined ? null : overrides.donationAmount,
  stripePaymentIntentId:
    overrides.stripePaymentIntentId === undefined
      ? 'pi_123'
      : overrides.stripePaymentIntentId,
  stripeChargeId:
    overrides.stripeChargeId === undefined
      ? 'ch_123'
      : overrides.stripeChargeId,
})

const createRegistration = (
  overrides: Partial<{
    id: string
    userId: string
    paymentRequiredSnapshot: boolean
    paymentStatus: PaymentStatus
    payments: ReturnType<typeof createLatestPayment>[]
    tournament: { id: string; format: TournamentFormat }
    user: { name: string }
  }> = {},
) => ({
  id: overrides.id ?? REG_UUID,
  userId: overrides.userId ?? USER_UUID,
  paymentRequiredSnapshot: overrides.paymentRequiredSnapshot ?? false,
  paymentStatus: overrides.paymentStatus ?? PaymentStatus.NOT_REQUIRED,
  payments: overrides.payments ?? [],
  tournament: overrides.tournament ?? {
    id: TOURN_UUID,
    format: TournamentFormat.SOLO,
  },
  user: overrides.user ?? { name: 'Alice' },
})

const createTeamMembership = (
  overrides: Partial<{
    teamId: string
    captainId: string
    teamName: string
    teamSize: number
    joinedAt: Date
    members: { userId: string; joinedAt: Date }[]
  }> = {},
) => ({
  joinedAt: overrides.joinedAt ?? TEAM_MEMBER_JOINED_AT,
  team: {
    id: overrides.teamId ?? TEAM_UUID,
    name: overrides.teamName ?? 'Team Alpha',
    captainId: overrides.captainId ?? USER_UUID,
    isFull: false,
    tournament: { teamSize: overrides.teamSize ?? 2 },
    members: overrides.members ?? [
      { userId: USER_UUID, joinedAt: TEAM_MEMBER_JOINED_AT },
      { userId: MEMBER_UUID, joinedAt: SECOND_MEMBER_JOINED_AT },
    ],
  },
})

const createTargetTeam = (
  overrides: Partial<{
    id: string
    name: string
    tournamentId: string
    teamSize: number
    members: number
  }> = {},
) => ({
  id: overrides.id ?? TARGET_TEAM_UUID,
  name: overrides.name ?? 'Team Beta',
  tournamentId: overrides.tournamentId ?? TOURN_UUID,
  tournament: { teamSize: overrides.teamSize ?? 2 },
  _count: { members: overrides.members ?? 1 },
})

describe('registration admin actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetSession.mockResolvedValue(ADMIN_SESSION)
    mockTxTeamMemberCount.mockResolvedValue(1)
  })

  it('rejects non-admin users for adminDeleteRegistration', async () => {
    mockGetSession.mockResolvedValue(USER_SESSION)

    expect(await adminDeleteRegistration({ registrationId: REG_UUID })).toEqual(
      {
        success: false,
        message: 'Unauthorized',
      },
    )
  })

  it('deletes a solo registration for admins', async () => {
    mockRegistrationFindUnique.mockResolvedValue(createRegistration())
    mockRegistrationDelete.mockResolvedValue({})

    expect(await adminDeleteRegistration({ registrationId: REG_UUID })).toEqual(
      {
        success: true,
        message: "L'inscription de Alice a été supprimée.",
      },
    )
  })

  it('returns an error when adminDeleteRegistration cannot find the registration', async () => {
    mockRegistrationFindUnique.mockResolvedValue(null)

    expect(await adminDeleteRegistration({ registrationId: REG_UUID })).toEqual(
      {
        success: false,
        message: 'Inscription introuvable.',
      },
    )
  })

  it('deletes a team registration even when no team membership is found', async () => {
    mockRegistrationFindUnique.mockResolvedValue(
      createRegistration({
        tournament: { id: TOURN_UUID, format: TournamentFormat.TEAM },
      }),
    )
    mockTeamMemberFindFirst.mockResolvedValue(null)

    expect(await adminDeleteRegistration({ registrationId: REG_UUID })).toEqual(
      {
        success: true,
        message: "L'inscription de Alice a été supprimée.",
      },
    )
    expect(mockTxTeamMemberDeleteMany).not.toHaveBeenCalled()
  })

  it('deletes a team registration and removes the player from the team when membership exists', async () => {
    mockRegistrationFindUnique.mockResolvedValue(
      createRegistration({
        tournament: { id: TOURN_UUID, format: TournamentFormat.TEAM },
      }),
    )
    mockTeamMemberFindFirst.mockResolvedValue(createTeamMembership())

    expect(await adminDeleteRegistration({ registrationId: REG_UUID })).toEqual(
      {
        success: true,
        message: "L'inscription de Alice a été supprimée.",
      },
    )
    expect(mockTxTeamMemberDeleteMany).toHaveBeenCalledWith({
      where: { teamId: TEAM_UUID, userId: USER_UUID },
    })
  })

  it('updates registration field values for admins', async () => {
    mockRegistrationFindUnique.mockResolvedValue({
      id: REG_UUID,
      tournament: {
        id: TOURN_UUID,
        fields: [{ label: 'Rang', type: 'TEXT', required: false }],
      },
      user: { name: 'Alice' },
    })
    mockRegistrationUpdate.mockResolvedValue({})

    expect(
      await adminUpdateRegistrationFields({
        registrationId: REG_UUID,
        fieldValues: { Rang: 'Diamond' },
      }),
    ).toEqual({
      success: true,
      message: 'Les champs de Alice ont été mis à jour.',
    })
  })

  it('returns an error when adminUpdateRegistrationFields cannot find the registration', async () => {
    mockRegistrationFindUnique.mockResolvedValue(null)

    expect(
      await adminUpdateRegistrationFields({
        registrationId: REG_UUID,
        fieldValues: { Rang: 'Diamond' },
      }),
    ).toEqual({
      success: false,
      message: 'Inscription introuvable.',
    })
  })

  it('returns a field validation error when adminUpdateRegistrationFields receives invalid data', async () => {
    mockRegistrationFindUnique.mockResolvedValue({
      id: REG_UUID,
      tournament: {
        id: TOURN_UUID,
        fields: [{ label: 'Rang', type: 'TEXT', required: true }],
      },
      user: { name: 'Alice' },
    })

    expect(
      await adminUpdateRegistrationFields({
        registrationId: REG_UUID,
        fieldValues: { Discord: 'Alice#1234' },
      }),
    ).toEqual({
      success: false,
      message: "Le champ « Discord » n'est pas défini pour ce tournoi.",
    })
  })

  it('changes a player team for admins', async () => {
    mockRegistrationFindUnique.mockResolvedValue({
      ...createRegistration({
        tournament: { id: TOURN_UUID, format: TournamentFormat.TEAM },
      }),
      status: RegistrationStatus.CONFIRMED,
    })
    mockTeamFindUnique.mockResolvedValue(createTargetTeam())
    mockTeamMemberFindFirst.mockResolvedValue(createTeamMembership())

    expect(
      await adminChangeTeam({
        registrationId: REG_UUID,
        targetTeamId: TARGET_TEAM_UUID,
      }),
    ).toEqual({
      success: true,
      message: 'Alice a été déplacé vers Team Beta.',
    })
  })

  it('returns an error when adminChangeTeam cannot find the registration', async () => {
    mockRegistrationFindUnique.mockResolvedValue(null)

    expect(
      await adminChangeTeam({
        registrationId: REG_UUID,
        targetTeamId: TARGET_TEAM_UUID,
      }),
    ).toEqual({
      success: false,
      message: 'Inscription introuvable.',
    })
  })

  it('returns an error when adminChangeTeam receives an inactive registration', async () => {
    mockRegistrationFindUnique.mockResolvedValue({
      ...createRegistration({
        tournament: { id: TOURN_UUID, format: TournamentFormat.TEAM },
      }),
      status: RegistrationStatus.CANCELLED,
    })

    expect(
      await adminChangeTeam({
        registrationId: REG_UUID,
        targetTeamId: TARGET_TEAM_UUID,
      }),
    ).toEqual({
      success: false,
      message: "Cette inscription n'est plus active.",
    })
  })

  it('returns an error when adminChangeTeam targets a solo tournament registration', async () => {
    mockRegistrationFindUnique.mockResolvedValue({
      ...createRegistration(),
      status: RegistrationStatus.CONFIRMED,
    })

    expect(
      await adminChangeTeam({
        registrationId: REG_UUID,
        targetTeamId: TARGET_TEAM_UUID,
      }),
    ).toEqual({
      success: false,
      message: "Ce tournoi n'est pas au format équipe.",
    })
  })

  it('returns an error when the target team cannot be found', async () => {
    mockRegistrationFindUnique.mockResolvedValue({
      ...createRegistration({
        tournament: { id: TOURN_UUID, format: TournamentFormat.TEAM },
      }),
      status: RegistrationStatus.CONFIRMED,
    })
    mockTeamFindUnique.mockResolvedValue(null)

    expect(
      await adminChangeTeam({
        registrationId: REG_UUID,
        targetTeamId: TARGET_TEAM_UUID,
      }),
    ).toEqual({
      success: false,
      message: 'Équipe cible introuvable.',
    })
  })

  it('returns an error when the target team belongs to a different tournament', async () => {
    mockRegistrationFindUnique.mockResolvedValue({
      ...createRegistration({
        tournament: { id: TOURN_UUID, format: TournamentFormat.TEAM },
      }),
      status: RegistrationStatus.CONFIRMED,
    })
    mockTeamFindUnique.mockResolvedValue(
      createTargetTeam({ tournamentId: 'other-tournament-id' }),
    )

    expect(
      await adminChangeTeam({
        registrationId: REG_UUID,
        targetTeamId: TARGET_TEAM_UUID,
      }),
    ).toEqual({
      success: false,
      message: "L'équipe cible n'appartient pas au même tournoi.",
    })
  })

  it('returns an error when the target team is already full before the transaction starts', async () => {
    mockRegistrationFindUnique.mockResolvedValue({
      ...createRegistration({
        tournament: { id: TOURN_UUID, format: TournamentFormat.TEAM },
      }),
      status: RegistrationStatus.CONFIRMED,
    })
    mockTeamFindUnique.mockResolvedValue(createTargetTeam({ members: 2 }))

    expect(
      await adminChangeTeam({
        registrationId: REG_UUID,
        targetTeamId: TARGET_TEAM_UUID,
      }),
    ).toEqual({
      success: false,
      message: "L'équipe cible est déjà complète.",
    })
  })

  it('returns an error when the player has no current team membership', async () => {
    mockRegistrationFindUnique.mockResolvedValue({
      ...createRegistration({
        tournament: { id: TOURN_UUID, format: TournamentFormat.TEAM },
      }),
      status: RegistrationStatus.CONFIRMED,
    })
    mockTeamFindUnique.mockResolvedValue(createTargetTeam())
    mockTeamMemberFindFirst.mockResolvedValue(null)

    expect(
      await adminChangeTeam({
        registrationId: REG_UUID,
        targetTeamId: TARGET_TEAM_UUID,
      }),
    ).toEqual({
      success: false,
      message: "Le joueur n'appartient à aucune équipe.",
    })
  })

  it('returns an error when the player is already in the target team', async () => {
    mockRegistrationFindUnique.mockResolvedValue({
      ...createRegistration({
        tournament: { id: TOURN_UUID, format: TournamentFormat.TEAM },
      }),
      status: RegistrationStatus.CONFIRMED,
    })
    mockTeamFindUnique.mockResolvedValue(createTargetTeam())
    mockTeamMemberFindFirst.mockResolvedValue(
      createTeamMembership({ teamId: TARGET_TEAM_UUID }),
    )

    expect(
      await adminChangeTeam({
        registrationId: REG_UUID,
        targetTeamId: TARGET_TEAM_UUID,
      }),
    ).toEqual({
      success: false,
      message: 'Le joueur est déjà dans cette équipe.',
    })
  })

  it('rejects team change when the target team becomes full inside the transaction', async () => {
    mockRegistrationFindUnique.mockResolvedValue({
      ...createRegistration({
        tournament: { id: TOURN_UUID, format: TournamentFormat.TEAM },
      }),
      status: RegistrationStatus.CONFIRMED,
    })
    mockTeamFindUnique.mockResolvedValue(createTargetTeam())
    mockTeamMemberFindFirst.mockResolvedValue(createTeamMembership())
    mockTxTeamMemberCount.mockResolvedValue(2)

    expect(
      await adminChangeTeam({
        registrationId: REG_UUID,
        targetTeamId: TARGET_TEAM_UUID,
      }),
    ).toEqual({
      success: false,
      message: "L'équipe cible est déjà complète.",
    })
  })

  it('returns an internal error when adminChangeTeam hits an unexpected transaction failure', async () => {
    mockRegistrationFindUnique.mockResolvedValue({
      ...createRegistration({
        tournament: { id: TOURN_UUID, format: TournamentFormat.TEAM },
      }),
      status: RegistrationStatus.CONFIRMED,
    })
    mockTeamFindUnique.mockResolvedValue(createTargetTeam())
    mockTeamMemberFindFirst.mockResolvedValue(createTeamMembership())
    mockTransaction.mockRejectedValueOnce(new Error('DB exploded'))

    expect(
      await adminChangeTeam({
        registrationId: REG_UUID,
        targetTeamId: TARGET_TEAM_UUID,
      }),
    ).toEqual({
      success: false,
      message: 'Internal server error',
    })
  })

  it('promotes a team member to captain for admins', async () => {
    mockTeamFindUnique.mockResolvedValue({
      id: TEAM_UUID,
      captainId: USER_UUID,
      tournamentId: TOURN_UUID,
      members: [{ userId: USER_UUID }, { userId: MEMBER_UUID }],
    })

    expect(
      await adminPromoteCaptain({ teamId: TEAM_UUID, userId: MEMBER_UUID }),
    ).toEqual({ success: true, message: 'Le capitaine a été mis à jour.' })
  })

  it('returns an error when adminPromoteCaptain cannot find the team', async () => {
    mockTeamFindUnique.mockResolvedValue(null)

    expect(
      await adminPromoteCaptain({ teamId: TEAM_UUID, userId: MEMBER_UUID }),
    ).toEqual({
      success: false,
      message: 'Équipe introuvable.',
    })
  })

  it('returns an error when adminPromoteCaptain targets a non-member', async () => {
    mockTeamFindUnique.mockResolvedValue({
      id: TEAM_UUID,
      captainId: USER_UUID,
      tournamentId: TOURN_UUID,
      members: [{ userId: USER_UUID }],
    })

    expect(
      await adminPromoteCaptain({ teamId: TEAM_UUID, userId: MEMBER_UUID }),
    ).toEqual({
      success: false,
      message: "L'utilisateur n'est pas membre de cette équipe.",
    })
  })

  it('returns an error when adminPromoteCaptain targets the current captain', async () => {
    mockTeamFindUnique.mockResolvedValue({
      id: TEAM_UUID,
      captainId: USER_UUID,
      tournamentId: TOURN_UUID,
      members: [{ userId: USER_UUID }, { userId: MEMBER_UUID }],
    })

    expect(
      await adminPromoteCaptain({ teamId: TEAM_UUID, userId: USER_UUID }),
    ).toEqual({
      success: false,
      message: "L'utilisateur est déjà capitaine.",
    })
  })

  it('refunds a paid registration for admins', async () => {
    mockRegistrationFindUnique.mockResolvedValue(
      createRegistration({
        paymentRequiredSnapshot: true,
        paymentStatus: PaymentStatus.PAID,
        payments: [createLatestPayment()],
      }),
    )

    expect(await adminRefundRegistration({ registrationId: REG_UUID })).toEqual(
      {
        success: true,
        message: "L'inscription de Alice a été remboursée.",
      },
    )
    expect(mockRefundCreate).toHaveBeenCalledOnce()
  })

  it('returns an error when adminRefundRegistration cannot find the registration', async () => {
    mockRegistrationFindUnique.mockResolvedValue(null)

    expect(await adminRefundRegistration({ registrationId: REG_UUID })).toEqual(
      {
        success: false,
        message: 'Inscription introuvable.',
      },
    )
  })

  it('returns an error when the registration never required payment', async () => {
    mockRegistrationFindUnique.mockResolvedValue(
      createRegistration({
        paymentRequiredSnapshot: false,
        paymentStatus: PaymentStatus.NOT_REQUIRED,
      }),
    )

    expect(await adminRefundRegistration({ registrationId: REG_UUID })).toEqual(
      {
        success: false,
        message: 'Cette inscription ne peut pas être remboursée.',
      },
    )
  })

  it('returns an error when the registration is not currently marked as PAID', async () => {
    mockRegistrationFindUnique.mockResolvedValue(
      createRegistration({
        paymentRequiredSnapshot: true,
        paymentStatus: PaymentStatus.PENDING,
      }),
    )

    expect(await adminRefundRegistration({ registrationId: REG_UUID })).toEqual(
      {
        success: false,
        message: 'Cette inscription ne peut pas être remboursée.',
      },
    )
  })

  it('returns an error when no latest Stripe payment exists', async () => {
    mockRegistrationFindUnique.mockResolvedValue(
      createRegistration({
        paymentRequiredSnapshot: true,
        paymentStatus: PaymentStatus.PAID,
        payments: [],
      }),
    )

    expect(await adminRefundRegistration({ registrationId: REG_UUID })).toEqual(
      {
        success: false,
        message: 'Aucun paiement Stripe associé à cette inscription.',
      },
    )
  })

  it('returns an error when the latest payment has no Stripe references', async () => {
    mockRegistrationFindUnique.mockResolvedValue(
      createRegistration({
        paymentRequiredSnapshot: true,
        paymentStatus: PaymentStatus.PAID,
        payments: [
          createLatestPayment({
            stripePaymentIntentId: null,
            stripeChargeId: null,
          }),
        ],
      }),
    )

    expect(await adminRefundRegistration({ registrationId: REG_UUID })).toEqual(
      {
        success: false,
        message:
          'Aucune référence Stripe (PaymentIntent ou Charge) trouvée pour ce paiement.',
      },
    )
  })

  it('stores a refund amount that excludes the donation for admin refunds', async () => {
    mockRegistrationFindUnique.mockResolvedValue(
      createRegistration({
        paymentRequiredSnapshot: true,
        paymentStatus: PaymentStatus.PAID,
        payments: [
          createLatestPayment({
            id: 'payment-2',
            amount: 700,
            donationAmount: 200,
            stripePaymentIntentId: 'pi_456',
            stripeChargeId: 'ch_456',
          }),
        ],
      }),
    )

    const result = await adminRefundRegistration({ registrationId: REG_UUID })

    expect(result.success).toBe(true)
    expect(mockTxPaymentUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'payment-2' },
        data: expect.objectContaining({
          status: PaymentStatus.REFUNDED,
          refundAmount: 500,
        }),
      }),
    )
    expect(mockRefundCreate).toHaveBeenCalledWith(
      expect.objectContaining({ amount: 500 }),
      expect.any(Object),
    )
  })

  it('refunds a team registration even when the team membership is already missing', async () => {
    mockRegistrationFindUnique.mockResolvedValue(
      createRegistration({
        paymentRequiredSnapshot: true,
        paymentStatus: PaymentStatus.PAID,
        payments: [createLatestPayment()],
        tournament: { id: TOURN_UUID, format: TournamentFormat.TEAM },
      }),
    )
    mockTeamMemberFindFirst.mockResolvedValue(null)

    expect(await adminRefundRegistration({ registrationId: REG_UUID })).toEqual(
      {
        success: true,
        message: "L'inscription de Alice a été remboursée.",
      },
    )
    expect(mockTxTeamMemberDeleteMany).not.toHaveBeenCalled()
    expect(mockRefundCreate).toHaveBeenCalledOnce()
  })

  it('refunds a team registration and tracks team revert info when the player still has a team', async () => {
    mockRegistrationFindUnique.mockResolvedValue(
      createRegistration({
        paymentRequiredSnapshot: true,
        paymentStatus: PaymentStatus.PAID,
        payments: [createLatestPayment()],
        tournament: { id: TOURN_UUID, format: TournamentFormat.TEAM },
      }),
    )
    mockTeamMemberFindFirst.mockResolvedValue(createTeamMembership())

    expect(await adminRefundRegistration({ registrationId: REG_UUID })).toEqual(
      {
        success: true,
        message: "L'inscription de Alice a été remboursée.",
      },
    )
    expect(mockTxTeamMemberDeleteMany).toHaveBeenCalledWith({
      where: { teamId: TEAM_UUID, userId: USER_UUID },
    })
    expect(mockTxTeamUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ captainId: MEMBER_UUID }),
      }),
    )
    expect(mockRefundCreate).toHaveBeenCalledOnce()
  })
})
