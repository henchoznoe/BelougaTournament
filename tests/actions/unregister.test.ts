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
  payments: [
    {
      id: 'pay-1',
      status: PaymentStatus.PAID,
      amount: 500,
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
