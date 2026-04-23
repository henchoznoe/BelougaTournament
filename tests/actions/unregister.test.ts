/**
 * File: tests/actions/unregister.test.ts
 * Description: Unit tests for the unregisterFromTournament action.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  PaymentStatus,
  RefundPolicyType,
  RegistrationStatus,
  Role,
  TournamentFormat,
  TournamentStatus,
} from '@/prisma/generated/prisma/enums'

const TOURNAMENT_UUID = '33333333-3333-4333-8333-333333333333'
const USER_UUID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'

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

vi.mock('@/lib/core/env', () => ({
  env: { NEXT_PUBLIC_APP_URL: 'http://localhost:3000' },
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

const mockRefundsCreate = vi.fn()
vi.mock('@/lib/core/stripe', () => ({
  REGISTRATION_HOLD_MINUTES: 15,
  getStripe: () => ({
    refunds: { create: (...args: unknown[]) => mockRefundsCreate(...args) },
  }),
}))

const mockRegistrationFindUnique = vi.fn()
const mockRegistrationUpdate = vi.fn()
const mockRegistrationDelete = vi.fn()
const mockTeamMemberFindFirst = vi.fn()
const mockTeamMemberDeleteMany = vi.fn()
const mockPaymentUpdate = vi.fn()
const mockTransaction = vi.fn()

vi.mock('@/lib/core/prisma', () => ({
  default: {
    tournamentRegistration: {
      findUnique: (...args: unknown[]) => mockRegistrationFindUnique(...args),
      update: (...args: unknown[]) => mockRegistrationUpdate(...args),
      delete: (...args: unknown[]) => mockRegistrationDelete(...args),
    },
    teamMember: {
      findFirst: (...args: unknown[]) => mockTeamMemberFindFirst(...args),
      deleteMany: (...args: unknown[]) => mockTeamMemberDeleteMany(...args),
    },
    payment: {
      update: (...args: unknown[]) => mockPaymentUpdate(...args),
    },
    $transaction: (...args: unknown[]) => mockTransaction(...args),
  },
}))

const { unregisterFromTournament } = await import(
  '@/lib/actions/tournament-unregistration'
)

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const makeSession = () => ({
  user: {
    id: USER_UUID,
    role: Role.USER,
    email: 'user@test.com',
    name: 'User',
  },
  session: {
    id: 'sess-1',
    userId: USER_UUID,
    token: 'tok',
    expiresAt: '2027-01-01',
  },
})

const makeSoloFreeRegistration = () => ({
  id: 'reg-1',
  userId: USER_UUID,
  paymentRequiredSnapshot: false,
  paymentStatus: PaymentStatus.NOT_REQUIRED,
  payments: [],
  tournament: {
    id: TOURNAMENT_UUID,
    status: TournamentStatus.PUBLISHED,
    format: TournamentFormat.SOLO,
    startDate: new Date('2026-08-01T10:00:00.000Z'),
    refundPolicyType: RefundPolicyType.NONE,
    refundDeadlineDays: null,
  },
})

const makeSoloPaidRegistration = (refundEligible: boolean) => ({
  id: 'reg-paid-1',
  userId: USER_UUID,
  paymentRequiredSnapshot: true,
  paymentStatus: PaymentStatus.PAID,
  refundDeadlineDaysSnapshot: refundEligible ? 30 : null,
  payments: [
    {
      id: 'pay-1',
      status: PaymentStatus.PAID,
      amount: 500,
      donationAmount: null,
      stripeFee: null,
      stripePaymentIntentId: 'pi_test',
      stripeChargeId: null,
    },
  ],
  tournament: {
    id: TOURNAMENT_UUID,
    status: TournamentStatus.PUBLISHED,
    format: TournamentFormat.SOLO,
    // Refund is eligible if tournament starts far enough in the future
    startDate: refundEligible
      ? new Date('2026-12-01T10:00:00.000Z')
      : new Date('2026-08-01T10:00:00.000Z'),
    refundPolicyType: refundEligible
      ? RefundPolicyType.BEFORE_DEADLINE
      : RefundPolicyType.NONE,
    refundDeadlineDays: refundEligible ? 30 : null,
  },
})

// ---------------------------------------------------------------------------
// SOLO free — direct delete
// ---------------------------------------------------------------------------

describe('unregisterFromTournament — SOLO free', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-04-15T12:00:00.000Z'))

    mockGetSession.mockResolvedValue(makeSession())
    mockRegistrationFindUnique.mockResolvedValue(makeSoloFreeRegistration())
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('deletes the registration directly for a free SOLO tournament', async () => {
    const result = await unregisterFromTournament({
      tournamentId: TOURNAMENT_UUID,
    })

    expect(result.success).toBe(true)
    expect(mockRegistrationDelete).toHaveBeenCalledOnce()
    expect(mockTransaction).not.toHaveBeenCalled()
    expect(mockRefundsCreate).not.toHaveBeenCalled()
  })

  it('returns an error when the registration cannot be found', async () => {
    mockRegistrationFindUnique.mockResolvedValue(null)

    const result = await unregisterFromTournament({
      tournamentId: TOURNAMENT_UUID,
    })

    expect(result).toEqual({
      success: false,
      message: 'Inscription introuvable.',
    })
  })

  it('returns an error when the tournament is no longer published', async () => {
    mockRegistrationFindUnique.mockResolvedValue({
      ...makeSoloFreeRegistration(),
      tournament: {
        ...makeSoloFreeRegistration().tournament,
        status: TournamentStatus.ARCHIVED,
      },
    })

    const result = await unregisterFromTournament({
      tournamentId: TOURNAMENT_UUID,
    })

    expect(result).toEqual({
      success: false,
      message: 'Ce tournoi ne permet plus de désinscription.',
    })
  })

  it('returns an error when the tournament has already started', async () => {
    mockRegistrationFindUnique.mockResolvedValue({
      ...makeSoloFreeRegistration(),
      tournament: {
        ...makeSoloFreeRegistration().tournament,
        startDate: new Date('2026-04-15T11:00:00.000Z'),
      },
    })

    const result = await unregisterFromTournament({
      tournamentId: TOURNAMENT_UUID,
    })

    expect(result).toEqual({
      success: false,
      message:
        'Le tournoi a déjà commencé. La désinscription est indisponible.',
    })
  })
})

// ---------------------------------------------------------------------------
// SOLO paid — refund eligible
// ---------------------------------------------------------------------------

describe('unregisterFromTournament — SOLO paid, refund eligible', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    // Set current date far enough before tournament start (startDate 2026-12-01, refundDeadlineDays=30)
    vi.setSystemTime(new Date('2026-04-15T12:00:00.000Z'))

    mockGetSession.mockResolvedValue(makeSession())
    mockRegistrationFindUnique.mockResolvedValue(makeSoloPaidRegistration(true))

    mockTransaction.mockImplementation(
      async (callback: (tx: unknown) => unknown) =>
        callback({
          tournamentRegistration: { update: mockRegistrationUpdate },
          payment: { update: mockPaymentUpdate },
        }),
    )

    mockRefundsCreate.mockResolvedValue({ id: 'ref_test' })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('cancels registration, marks payment refunded, and calls Stripe refunds.create', async () => {
    const result = await unregisterFromTournament({
      tournamentId: TOURNAMENT_UUID,
    })

    expect(result.success).toBe(true)
    expect(result.message).toContain('remboursée')
    expect(mockRegistrationUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: RegistrationStatus.CANCELLED }),
      }),
    )
    expect(mockPaymentUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: PaymentStatus.REFUNDED }),
      }),
    )
    expect(mockRefundsCreate).toHaveBeenCalledOnce()
  })
})

// ---------------------------------------------------------------------------
// SOLO paid — past refund deadline
// ---------------------------------------------------------------------------

describe('unregisterFromTournament — SOLO paid, past refund deadline', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-04-15T12:00:00.000Z'))

    mockGetSession.mockResolvedValue(makeSession())
    // NONE refund policy = never refundable
    mockRegistrationFindUnique.mockResolvedValue(
      makeSoloPaidRegistration(false),
    )

    mockTransaction.mockImplementation(
      async (callback: (tx: unknown) => unknown) =>
        callback({
          tournamentRegistration: { update: mockRegistrationUpdate },
          payment: { update: mockPaymentUpdate },
        }),
    )
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('cancels registration without issuing a Stripe refund', async () => {
    const result = await unregisterFromTournament({
      tournamentId: TOURNAMENT_UUID,
    })

    expect(result.success).toBe(true)
    expect(result.message).not.toContain('remboursée')
    expect(mockRefundsCreate).not.toHaveBeenCalled()
    expect(mockRegistrationUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: RegistrationStatus.CANCELLED }),
      }),
    )
  })
})

// ---------------------------------------------------------------------------
// TEAM captain with another member — captain succession
// ---------------------------------------------------------------------------

describe('unregisterFromTournament — TEAM captain succession', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-04-15T12:00:00.000Z'))

    mockGetSession.mockResolvedValue(makeSession())

    mockRegistrationFindUnique.mockResolvedValue({
      id: 'reg-team-1',
      userId: USER_UUID,
      paymentRequiredSnapshot: false,
      paymentStatus: PaymentStatus.NOT_REQUIRED,
      payments: [],
      tournament: {
        id: TOURNAMENT_UUID,
        status: TournamentStatus.PUBLISHED,
        format: TournamentFormat.TEAM,
        startDate: new Date('2026-08-01T10:00:00.000Z'),
        refundPolicyType: RefundPolicyType.NONE,
        refundDeadlineDays: null,
      },
    })

    const OTHER_USER = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
    mockTeamMemberFindFirst.mockResolvedValue({
      teamId: 'team-1',
      userId: USER_UUID,
      joinedAt: new Date('2026-03-01T00:00:00.000Z'),
      team: {
        id: 'team-1',
        captainId: USER_UUID,
        isFull: false,
        name: 'Les Wolves',
        tournamentId: TOURNAMENT_UUID,
        members: [
          { userId: USER_UUID, joinedAt: new Date('2026-03-01T00:00:00.000Z') },
          {
            userId: OTHER_USER,
            joinedAt: new Date('2026-03-02T00:00:00.000Z'),
          },
        ],
        tournament: { teamSize: 5 },
      },
    })

    const mockTeamUpdate = vi.fn()
    mockTransaction.mockImplementation(
      async (callback: (tx: unknown) => unknown) =>
        callback({
          tournamentRegistration: {
            delete: mockRegistrationDelete,
            update: mockRegistrationUpdate,
          },
          teamMember: {
            deleteMany: mockTeamMemberDeleteMany,
            count: vi.fn().mockResolvedValue(1),
          },
          team: { update: mockTeamUpdate, delete: vi.fn() },
          payment: { update: mockPaymentUpdate },
        }),
    )
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('succeeds and removes the captain from the team', async () => {
    const result = await unregisterFromTournament({
      tournamentId: TOURNAMENT_UUID,
    })

    expect(result.success).toBe(true)
    expect(mockTeamMemberDeleteMany).toHaveBeenCalledOnce()
  })
})

// ---------------------------------------------------------------------------
// TEAM last member — team dissolution
// ---------------------------------------------------------------------------

describe('unregisterFromTournament — TEAM last member (team dissolution)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-04-15T12:00:00.000Z'))

    mockGetSession.mockResolvedValue(makeSession())

    mockRegistrationFindUnique.mockResolvedValue({
      id: 'reg-team-last',
      userId: USER_UUID,
      paymentRequiredSnapshot: false,
      paymentStatus: PaymentStatus.NOT_REQUIRED,
      payments: [],
      tournament: {
        id: TOURNAMENT_UUID,
        status: TournamentStatus.PUBLISHED,
        format: TournamentFormat.TEAM,
        startDate: new Date('2026-08-01T10:00:00.000Z'),
        refundPolicyType: RefundPolicyType.NONE,
        refundDeadlineDays: null,
      },
    })

    // Only one member: the user themselves
    mockTeamMemberFindFirst.mockResolvedValue({
      teamId: 'team-solo',
      userId: USER_UUID,
      joinedAt: new Date('2026-03-01T00:00:00.000Z'),
      team: {
        id: 'team-solo',
        captainId: USER_UUID,
        isFull: false,
        name: 'Solo Team',
        tournamentId: TOURNAMENT_UUID,
        members: [
          { userId: USER_UUID, joinedAt: new Date('2026-03-01T00:00:00.000Z') },
        ],
        tournament: { teamSize: 5 },
      },
    })

    const mockTeamDelete = vi.fn()
    mockTransaction.mockImplementation(
      async (callback: (tx: unknown) => unknown) =>
        callback({
          tournamentRegistration: {
            delete: mockRegistrationDelete,
            update: mockRegistrationUpdate,
          },
          teamMember: { deleteMany: mockTeamMemberDeleteMany },
          team: { update: vi.fn(), delete: mockTeamDelete },
          payment: { update: mockPaymentUpdate },
        }),
    )
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('succeeds and dissolves the team when last member leaves', async () => {
    const result = await unregisterFromTournament({
      tournamentId: TOURNAMENT_UUID,
    })

    expect(result.success).toBe(true)
    expect(mockTeamMemberDeleteMany).toHaveBeenCalledOnce()
  })
})

// ---------------------------------------------------------------------------
// TEAM paid — registration exists but no team membership
// ---------------------------------------------------------------------------

describe('unregisterFromTournament — TEAM paid without team membership', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-04-15T12:00:00.000Z'))

    mockGetSession.mockResolvedValue(makeSession())
    mockRegistrationFindUnique.mockResolvedValue({
      id: 'reg-team-paid-edge',
      userId: USER_UUID,
      paymentRequiredSnapshot: true,
      paymentStatus: PaymentStatus.PAID,
      refundDeadlineDaysSnapshot: 30,
      payments: [
        {
          id: 'pay-team-edge',
          status: PaymentStatus.PAID,
          amount: 500,
          donationAmount: null,
          stripeFee: null,
          stripePaymentIntentId: 'pi_team_edge',
          stripeChargeId: null,
        },
      ],
      tournament: {
        id: TOURNAMENT_UUID,
        status: TournamentStatus.PUBLISHED,
        format: TournamentFormat.TEAM,
        startDate: new Date('2026-12-01T10:00:00.000Z'),
        refundPolicyType: RefundPolicyType.BEFORE_DEADLINE,
        refundDeadlineDays: 30,
      },
    })
    mockTeamMemberFindFirst.mockResolvedValue(null)
    mockTransaction.mockImplementation(
      async (callback: (tx: unknown) => unknown) =>
        callback({
          tournamentRegistration: {
            update: mockRegistrationUpdate,
            delete: mockRegistrationDelete,
          },
          payment: { update: mockPaymentUpdate },
        }),
    )
    mockRefundsCreate.mockResolvedValue({ id: 'ref_team_edge' })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('cancels and refunds the registration even without a matching team membership', async () => {
    const result = await unregisterFromTournament({
      tournamentId: TOURNAMENT_UUID,
    })

    expect(result.success).toBe(true)
    expect(result.message).toContain('remboursée')
    expect(mockRefundsCreate).toHaveBeenCalledOnce()
  })

  it('returns the free cancellation message when a free team registration has no membership', async () => {
    mockRegistrationFindUnique.mockResolvedValue({
      id: 'reg-team-free-edge',
      userId: USER_UUID,
      paymentRequiredSnapshot: false,
      paymentStatus: PaymentStatus.NOT_REQUIRED,
      refundDeadlineDaysSnapshot: null,
      payments: [],
      tournament: {
        id: TOURNAMENT_UUID,
        status: TournamentStatus.PUBLISHED,
        format: TournamentFormat.TEAM,
        startDate: new Date('2026-12-01T10:00:00.000Z'),
        refundPolicyType: RefundPolicyType.NONE,
        refundDeadlineDays: null,
      },
    })

    const result = await unregisterFromTournament({
      tournamentId: TOURNAMENT_UUID,
    })

    expect(result).toEqual({
      success: true,
      message: 'Votre inscription a été annulée.',
    })
  })

  it('cancels the registration without a refund when waiveRefund is used within the refund window', async () => {
    const result = await unregisterFromTournament({
      tournamentId: TOURNAMENT_UUID,
      waiveRefund: true,
    })

    expect(result.success).toBe(true)
    expect(result.message).toContain('offerts')
    expect(mockRefundsCreate).not.toHaveBeenCalled()
  })

  it('cancels the registration without refund when outside the refund window and no membership exists', async () => {
    mockRegistrationFindUnique.mockResolvedValue({
      id: 'reg-team-paid-edge-no-refund',
      userId: USER_UUID,
      paymentRequiredSnapshot: true,
      paymentStatus: PaymentStatus.PAID,
      refundDeadlineDaysSnapshot: null,
      payments: [
        {
          id: 'pay-team-edge-no-refund',
          status: PaymentStatus.PAID,
          amount: 500,
          donationAmount: null,
          stripeFee: null,
          stripePaymentIntentId: 'pi_team_edge_no_refund',
          stripeChargeId: null,
        },
      ],
      tournament: {
        id: TOURNAMENT_UUID,
        status: TournamentStatus.PUBLISHED,
        format: TournamentFormat.TEAM,
        startDate: new Date('2026-08-01T10:00:00.000Z'),
        refundPolicyType: RefundPolicyType.NONE,
        refundDeadlineDays: null,
      },
    })

    const result = await unregisterFromTournament({
      tournamentId: TOURNAMENT_UUID,
    })

    expect(result.success).toBe(true)
    expect(result.message).toContain("n'ouvre pas droit")
    expect(mockRefundsCreate).not.toHaveBeenCalled()
  })
})

// ---------------------------------------------------------------------------
// TEAM paid — refund eligible with active team membership
// ---------------------------------------------------------------------------

describe('unregisterFromTournament — TEAM paid with refund', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-04-15T12:00:00.000Z'))

    mockGetSession.mockResolvedValue(makeSession())
    mockRegistrationFindUnique.mockResolvedValue({
      id: 'reg-team-paid',
      userId: USER_UUID,
      paymentRequiredSnapshot: true,
      paymentStatus: PaymentStatus.PAID,
      refundDeadlineDaysSnapshot: 30,
      payments: [
        {
          id: 'pay-team-paid',
          status: PaymentStatus.PAID,
          amount: 500,
          donationAmount: null,
          stripeFee: null,
          stripePaymentIntentId: 'pi_team_paid',
          stripeChargeId: null,
        },
      ],
      tournament: {
        id: TOURNAMENT_UUID,
        status: TournamentStatus.PUBLISHED,
        format: TournamentFormat.TEAM,
        startDate: new Date('2026-12-01T10:00:00.000Z'),
        refundPolicyType: RefundPolicyType.BEFORE_DEADLINE,
        refundDeadlineDays: 30,
      },
    })
    mockTeamMemberFindFirst.mockResolvedValue({
      teamId: 'team-paid',
      userId: USER_UUID,
      joinedAt: new Date('2026-03-01T00:00:00.000Z'),
      team: {
        id: 'team-paid',
        captainId: USER_UUID,
        isFull: false,
        name: 'Paid Team',
        tournamentId: TOURNAMENT_UUID,
        members: [
          { userId: USER_UUID, joinedAt: new Date('2026-03-01T00:00:00.000Z') },
          {
            userId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
            joinedAt: new Date('2026-03-02T00:00:00.000Z'),
          },
        ],
        tournament: { teamSize: 5 },
      },
    })

    const mockTeamUpdate = vi.fn()
    mockTransaction.mockImplementation(
      async (callback: (tx: unknown) => unknown) =>
        callback({
          tournamentRegistration: { update: mockRegistrationUpdate },
          teamMember: {
            deleteMany: mockTeamMemberDeleteMany,
            count: vi.fn().mockResolvedValue(1),
          },
          team: { update: mockTeamUpdate, delete: vi.fn() },
          payment: { update: mockPaymentUpdate },
        }),
    )
    mockRefundsCreate.mockResolvedValue({ id: 'ref_team_paid' })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('refunds a paid team registration after removing the user from the team', async () => {
    const result = await unregisterFromTournament({
      tournamentId: TOURNAMENT_UUID,
    })

    expect(result.success).toBe(true)
    expect(result.message).toContain('remboursée')
    expect(mockTeamMemberDeleteMany).toHaveBeenCalledOnce()
    expect(mockRefundsCreate).toHaveBeenCalledOnce()
  })

  it('cancels a paid team registration without refund when outside the refund window', async () => {
    mockRegistrationFindUnique.mockResolvedValue({
      id: 'reg-team-paid-no-refund',
      userId: USER_UUID,
      paymentRequiredSnapshot: true,
      paymentStatus: PaymentStatus.PAID,
      refundDeadlineDaysSnapshot: null,
      payments: [
        {
          id: 'pay-team-paid-no-refund',
          status: PaymentStatus.PAID,
          amount: 500,
          donationAmount: null,
          stripeFee: null,
          stripePaymentIntentId: 'pi_team_paid_no_refund',
          stripeChargeId: null,
        },
      ],
      tournament: {
        id: TOURNAMENT_UUID,
        status: TournamentStatus.PUBLISHED,
        format: TournamentFormat.TEAM,
        startDate: new Date('2026-08-01T10:00:00.000Z'),
        refundPolicyType: RefundPolicyType.NONE,
        refundDeadlineDays: null,
      },
    })

    const result = await unregisterFromTournament({
      tournamentId: TOURNAMENT_UUID,
    })

    expect(result.success).toBe(true)
    expect(result.message).toContain("n'ouvre pas droit")
    expect(mockRefundsCreate).not.toHaveBeenCalled()
  })

  it('forfeits a paid team registration without refund when waiveRefund is used within the refund window', async () => {
    const result = await unregisterFromTournament({
      tournamentId: TOURNAMENT_UUID,
      waiveRefund: true,
    })

    expect(result.success).toBe(true)
    expect(result.message).toContain('offerts')
    expect(mockRefundsCreate).not.toHaveBeenCalled()
  })
})

// ---------------------------------------------------------------------------
// SOLO paid — waiveRefund: true within refund window → FORFEITED, no Stripe call
// ---------------------------------------------------------------------------

describe('unregisterFromTournament — SOLO paid, waiveRefund within window', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-04-15T12:00:00.000Z'))

    mockGetSession.mockResolvedValue(makeSession())
    mockRegistrationFindUnique.mockResolvedValue(makeSoloPaidRegistration(true))

    mockTransaction.mockImplementation(
      async (callback: (tx: unknown) => unknown) =>
        callback({
          tournamentRegistration: { update: mockRegistrationUpdate },
          payment: { update: mockPaymentUpdate },
        }),
    )
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('marks registration and payment as FORFEITED without calling Stripe', async () => {
    const result = await unregisterFromTournament({
      tournamentId: TOURNAMENT_UUID,
      waiveRefund: true,
    })

    expect(result.success).toBe(true)
    expect(result.message).toContain('offerts')
    expect(mockRegistrationUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: RegistrationStatus.CANCELLED,
          paymentStatus: PaymentStatus.FORFEITED,
        }),
      }),
    )
    expect(mockPaymentUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: PaymentStatus.FORFEITED }),
      }),
    )
    expect(mockRefundsCreate).not.toHaveBeenCalled()
  })
})

// ---------------------------------------------------------------------------
// SOLO paid — waiveRefund: true outside refund window → normal cancellation (no FORFEITED)
// ---------------------------------------------------------------------------

describe('unregisterFromTournament — SOLO paid, waiveRefund outside window', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-04-15T12:00:00.000Z'))

    mockGetSession.mockResolvedValue(makeSession())
    // NONE refund policy: never eligible, waiveRefund has no effect
    mockRegistrationFindUnique.mockResolvedValue(
      makeSoloPaidRegistration(false),
    )

    mockTransaction.mockImplementation(
      async (callback: (tx: unknown) => unknown) =>
        callback({
          tournamentRegistration: { update: mockRegistrationUpdate },
          payment: { update: mockPaymentUpdate },
        }),
    )
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('ignores waiveRefund and cancels normally without Stripe or FORFEITED status', async () => {
    const result = await unregisterFromTournament({
      tournamentId: TOURNAMENT_UUID,
      waiveRefund: true,
    })

    expect(result.success).toBe(true)
    expect(result.message).not.toContain('offerts')
    expect(mockRefundsCreate).not.toHaveBeenCalled()
    // Payment should NOT be set to FORFEITED since we're outside the window
    expect(mockPaymentUpdate).not.toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: PaymentStatus.FORFEITED }),
      }),
    )
  })
})

// ---------------------------------------------------------------------------
// SOLO paid with donation — refund excludes donation amount
// ---------------------------------------------------------------------------

describe('unregisterFromTournament — SOLO paid with donation, refund eligible', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-04-15T12:00:00.000Z'))

    mockGetSession.mockResolvedValue(makeSession())

    // Registration with a donation of 200 centimes on top of 500 entry fee
    mockRegistrationFindUnique.mockResolvedValue({
      id: 'reg-paid-donation',
      userId: USER_UUID,
      paymentRequiredSnapshot: true,
      paymentStatus: PaymentStatus.PAID,
      refundDeadlineDaysSnapshot: 30,
      payments: [
        {
          id: 'pay-donation',
          status: PaymentStatus.PAID,
          amount: 700, // 500 entry + 200 donation
          donationAmount: 200,
          stripeFee: null,
          stripePaymentIntentId: 'pi_donation_test',
          stripeChargeId: null,
        },
      ],
      tournament: {
        id: TOURNAMENT_UUID,
        status: TournamentStatus.PUBLISHED,
        format: TournamentFormat.SOLO,
        startDate: new Date('2026-12-01T10:00:00.000Z'),
        refundPolicyType: RefundPolicyType.BEFORE_DEADLINE,
        refundDeadlineDays: 30,
      },
    })

    mockTransaction.mockImplementation(
      async (callback: (tx: unknown) => unknown) =>
        callback({
          tournamentRegistration: { update: mockRegistrationUpdate },
          payment: { update: mockPaymentUpdate },
        }),
    )

    mockRefundsCreate.mockResolvedValue({ id: 'ref_donation_test' })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('refunds only the entry fee (amount minus donation) and excludes the donation', async () => {
    const result = await unregisterFromTournament({
      tournamentId: TOURNAMENT_UUID,
    })

    expect(result.success).toBe(true)
    expect(mockRefundsCreate).toHaveBeenCalledOnce()
    // Stripe refund amount should be 500 (700 total - 200 donation)
    expect(mockRefundsCreate).toHaveBeenCalledWith(
      expect.objectContaining({ amount: 500 }),
      expect.any(Object),
    )
  })
})
