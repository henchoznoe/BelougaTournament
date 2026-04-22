/**
 * File: tests/actions/tournament-payments.test.ts
 * Description: Unit tests for paid tournament checkout actions.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  DonationType,
  PaymentStatus,
  RefundPolicyType,
  RegistrationStatus,
  RegistrationType,
  Role,
  TournamentFormat,
  TournamentStatus,
} from '@/prisma/generated/prisma/enums'

const TOURNAMENT_UUID = '11111111-1111-4111-8111-111111111111'

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
  env: {
    NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
  },
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

const mockCheckoutCreate = vi.fn()
vi.mock('@/lib/core/stripe', () => ({
  REGISTRATION_HOLD_MINUTES: 15,
  getStripe: () => ({
    checkout: {
      sessions: {
        create: (...args: unknown[]) => mockCheckoutCreate(...args),
      },
    },
  }),
}))

const mockUserFindUnique = vi.fn()
const mockTournamentFindUnique = vi.fn()
const mockRegistrationFindUnique = vi.fn()
const mockRegistrationFindFirst = vi.fn()
const mockRegistrationFindMany = vi.fn()
const mockTxRegistrationFindUnique = vi.fn()
const mockRegistrationCount = vi.fn()
const mockRegistrationCreate = vi.fn()
const mockRegistrationUpdate = vi.fn()
const mockPaymentFindMany = vi.fn()
const mockPaymentUpdateMany = vi.fn()
const mockPaymentCreate = vi.fn()
const mockPaymentUpdate = vi.fn()
const mockTransaction = vi.fn()
const mockTeamFindUnique = vi.fn()
const mockTeamCreate = vi.fn()
const mockTeamCount = vi.fn()
const mockTeamMemberCreate = vi.fn()
const mockTeamMemberDeleteMany = vi.fn()

vi.mock('@/lib/core/prisma', () => ({
  default: {
    user: {
      findUnique: (...args: unknown[]) => mockUserFindUnique(...args),
    },
    tournament: {
      findUnique: (...args: unknown[]) => mockTournamentFindUnique(...args),
    },
    tournamentRegistration: {
      findUnique: (...args: unknown[]) => mockRegistrationFindUnique(...args),
      findFirst: (...args: unknown[]) => mockRegistrationFindFirst(...args),
      findMany: (...args: unknown[]) => mockRegistrationFindMany(...args),
      count: (...args: unknown[]) => mockRegistrationCount(...args),
      create: (...args: unknown[]) => mockRegistrationCreate(...args),
      update: (...args: unknown[]) => mockRegistrationUpdate(...args),
    },
    payment: {
      findMany: (...args: unknown[]) => mockPaymentFindMany(...args),
      updateMany: (...args: unknown[]) => mockPaymentUpdateMany(...args),
      create: (...args: unknown[]) => mockPaymentCreate(...args),
      update: (...args: unknown[]) => mockPaymentUpdate(...args),
    },
    team: {
      findUnique: (...args: unknown[]) => mockTeamFindUnique(...args),
      create: (...args: unknown[]) => mockTeamCreate(...args),
      count: (...args: unknown[]) => mockTeamCount(...args),
    },
    teamMember: {
      create: (...args: unknown[]) => mockTeamMemberCreate(...args),
      deleteMany: (...args: unknown[]) => mockTeamMemberDeleteMany(...args),
    },
    $transaction: (...args: unknown[]) => mockTransaction(...args),
  },
}))

const { registerForTournament, createTeamAndRegister, joinTeamAndRegister } =
  await import('@/lib/actions/tournament-registration')

describe('paid tournament registration actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()

    mockGetSession.mockResolvedValue({
      user: {
        id: 'user-1',
        role: Role.USER,
        email: 'user@test.com',
        name: 'User',
      },
      session: {
        id: 'sess-1',
        userId: 'user-1',
        token: 'tok',
        expiresAt: '2027-01-01',
      },
    })

    mockTournamentFindUnique.mockResolvedValue({
      id: TOURNAMENT_UUID,
      title: 'PUBG Duo Cup',
      status: TournamentStatus.PUBLISHED,
      format: TournamentFormat.SOLO,
      startDate: new Date('2026-04-15T00:00:00.000Z'),
      endDate: new Date('2026-04-16T00:00:00.000Z'),
      registrationOpen: new Date('2026-04-01T00:00:00.000Z'),
      registrationClose: new Date('2026-05-01T00:00:00.000Z'),
      maxTeams: null,
      teamSize: 1,
      registrationType: RegistrationType.PAID,
      entryFeeAmount: 500,
      entryFeeCurrency: 'CHF',
      refundPolicyType: RefundPolicyType.BEFORE_DEADLINE,
      refundDeadlineDays: 14,
      fields: [],
    })
    mockRegistrationFindUnique.mockResolvedValue(null)
    mockRegistrationFindFirst.mockResolvedValue(null)
    mockRegistrationFindMany.mockResolvedValue([])
    mockTxRegistrationFindUnique.mockResolvedValue({
      id: 'reg-1',
      status: RegistrationStatus.PENDING,
      paymentStatus: PaymentStatus.PENDING,
    })
    mockPaymentFindMany.mockResolvedValue([])
    mockRegistrationCount.mockResolvedValue(0)
    mockRegistrationCreate.mockResolvedValue({ id: 'reg-1' })
    mockPaymentCreate.mockResolvedValue({ id: 'pay-1' })
    mockCheckoutCreate.mockResolvedValue({
      id: 'cs_test_123',
      url: 'https://checkout.stripe.test/session',
      customer: null,
    })

    mockTransaction.mockImplementation(async callback =>
      callback({
        payment: {
          updateMany: mockPaymentUpdateMany,
          create: mockPaymentCreate,
          update: mockPaymentUpdate,
        },
        tournamentRegistration: {
          count: mockRegistrationCount,
          create: mockRegistrationCreate,
          update: mockRegistrationUpdate,
          findUnique: mockTxRegistrationFindUnique,
        },
        team: {
          findUnique: mockTeamFindUnique,
          create: mockTeamCreate,
          count: mockTeamCount,
        },
        teamMember: {
          create: mockTeamMemberCreate,
          deleteMany: mockTeamMemberDeleteMany,
        },
      }),
    )

    vi.setSystemTime(new Date('2026-04-15T12:00:00.000Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('creates a Stripe checkout session for paid solo registrations', async () => {
    const result = await registerForTournament({
      tournamentId: TOURNAMENT_UUID,
      returnPath: '/tournaments/pubg-duo-cup',
      fieldValues: {},
    })

    expect(result.success).toBe(true)
    expect(result.data).toEqual({
      checkoutUrl: 'https://checkout.stripe.test/session',
    })
    expect(mockRegistrationCreate).toHaveBeenCalledOnce()
    expect(mockPaymentCreate).toHaveBeenCalledOnce()
    expect(mockCheckoutCreate).toHaveBeenCalledOnce()
  })
})

// ---------------------------------------------------------------------------
// createTeamAndRegister (TEAM free)
// ---------------------------------------------------------------------------

const TEAM_TOURNAMENT_UUID = '22222222-2222-4222-8222-222222222222'
const TEAM_UUID = '33333333-3333-4333-8333-333333333333'

describe('createTeamAndRegister — TEAM free tournament', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()

    mockGetSession.mockResolvedValue({
      user: {
        id: 'user-1',
        role: Role.USER,
        email: 'user@test.com',
        name: 'User',
      },
      session: {
        id: 'sess-1',
        userId: 'user-1',
        token: 'tok',
        expiresAt: '2027-01-01',
      },
    })

    mockUserFindUnique.mockResolvedValue({ bannedAt: null })

    mockTournamentFindUnique.mockResolvedValue({
      id: TEAM_TOURNAMENT_UUID,
      title: 'Team Cup',
      status: TournamentStatus.PUBLISHED,
      format: TournamentFormat.TEAM,
      startDate: new Date('2026-04-15T00:00:00.000Z'),
      endDate: new Date('2026-04-16T00:00:00.000Z'),
      registrationOpen: new Date('2026-04-01T00:00:00.000Z'),
      registrationClose: new Date('2026-05-01T00:00:00.000Z'),
      maxTeams: null,
      teamSize: 5,
      registrationType: RegistrationType.FREE,
      entryFeeAmount: null,
      entryFeeCurrency: null,
      refundPolicyType: RefundPolicyType.NONE,
      refundDeadlineDays: null,
      fields: [],
    })

    mockRegistrationFindUnique.mockResolvedValue(null)
    mockRegistrationFindFirst.mockResolvedValue(null)
    mockRegistrationFindMany.mockResolvedValue([])
    mockTxRegistrationFindUnique.mockResolvedValue({
      id: 'reg-team-1',
      status: RegistrationStatus.PENDING,
      paymentStatus: PaymentStatus.PENDING,
    })
    mockPaymentFindMany.mockResolvedValue([])
    mockRegistrationCount.mockResolvedValue(0)
    mockRegistrationCreate.mockResolvedValue({ id: 'reg-team-1' })
    mockTeamCreate.mockResolvedValue({
      id: 'team-1',
      _count: { members: 1 },
      isFull: false,
    })
    mockTeamCount.mockResolvedValue(0)
    mockTeamMemberCreate.mockResolvedValue({})

    mockTransaction.mockImplementation(async callback =>
      callback({
        payment: {
          updateMany: mockPaymentUpdateMany,
          create: mockPaymentCreate,
          update: mockPaymentUpdate,
        },
        tournamentRegistration: {
          count: mockRegistrationCount,
          create: mockRegistrationCreate,
          update: mockRegistrationUpdate,
          findUnique: mockTxRegistrationFindUnique,
        },
        team: {
          findUnique: mockTeamFindUnique,
          create: mockTeamCreate,
          count: mockTeamCount,
          update: vi.fn().mockResolvedValue({}),
        },
        teamMember: {
          create: mockTeamMemberCreate,
          deleteMany: mockTeamMemberDeleteMany,
          findFirst: vi.fn().mockResolvedValue(null),
          count: vi.fn().mockResolvedValue(1),
        },
      }),
    )

    vi.setSystemTime(new Date('2026-04-15T12:00:00.000Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('creates a team and registers the captain for a free TEAM tournament', async () => {
    const result = await createTeamAndRegister({
      tournamentId: TEAM_TOURNAMENT_UUID,
      returnPath: '/tournaments/team-cup',
      teamName: 'Les Wolves',
      fieldValues: {},
    })

    expect(result.success).toBe(true)
    expect(result.message).toContain('équipe')
    expect(mockCheckoutCreate).not.toHaveBeenCalled()
  })

  it('creates a paid duo checkout with a fixed donation line item', async () => {
    mockTournamentFindUnique.mockResolvedValue({
      id: TEAM_TOURNAMENT_UUID,
      title: 'PUBG Duo Cup',
      status: TournamentStatus.PUBLISHED,
      format: TournamentFormat.TEAM,
      startDate: new Date('2026-04-15T00:00:00.000Z'),
      endDate: new Date('2026-04-16T00:00:00.000Z'),
      registrationOpen: new Date('2026-04-01T00:00:00.000Z'),
      registrationClose: new Date('2026-05-01T00:00:00.000Z'),
      maxTeams: null,
      teamSize: 2,
      registrationType: RegistrationType.PAID,
      entryFeeAmount: 500,
      entryFeeCurrency: 'CHF',
      refundPolicyType: RefundPolicyType.BEFORE_DEADLINE,
      refundDeadlineDays: 7,
      donationEnabled: true,
      donationType: DonationType.FIXED,
      donationFixedAmount: 1000,
      donationMinAmount: null,
      fields: [],
    })
    mockPaymentCreate.mockResolvedValue({ id: 'pay-donation' })
    mockCheckoutCreate.mockResolvedValue({
      id: 'cs_test_donation',
      url: 'https://checkout.stripe.test/donation',
      customer: null,
    })

    const result = await createTeamAndRegister({
      tournamentId: TEAM_TOURNAMENT_UUID,
      returnPath: '/tournaments/pubg-duo-cup',
      teamName: 'Les Loups',
      fieldValues: {},
      donationAmount: 1000,
    })

    expect(result.success).toBe(true)
    expect(mockPaymentCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          amount: 1500,
          donationAmount: 1000,
        }),
      }),
    )

    const [checkoutPayload] = mockCheckoutCreate.mock.calls[0] ?? []
    expect(checkoutPayload.line_items).toHaveLength(2)
    expect(checkoutPayload.line_items[0].price_data.unit_amount).toBe(500)
    expect(checkoutPayload.line_items[1].price_data.unit_amount).toBe(1000)
  })

  it('rejects a forged fixed donation amount before creating the team', async () => {
    mockTournamentFindUnique.mockResolvedValue({
      id: TEAM_TOURNAMENT_UUID,
      title: 'PUBG Duo Cup',
      status: TournamentStatus.PUBLISHED,
      format: TournamentFormat.TEAM,
      startDate: new Date('2026-04-15T00:00:00.000Z'),
      endDate: new Date('2026-04-16T00:00:00.000Z'),
      registrationOpen: new Date('2026-04-01T00:00:00.000Z'),
      registrationClose: new Date('2026-05-01T00:00:00.000Z'),
      maxTeams: null,
      teamSize: 2,
      registrationType: RegistrationType.PAID,
      entryFeeAmount: 500,
      entryFeeCurrency: 'CHF',
      refundPolicyType: RefundPolicyType.BEFORE_DEADLINE,
      refundDeadlineDays: 7,
      donationEnabled: true,
      donationType: DonationType.FIXED,
      donationFixedAmount: 1000,
      donationMinAmount: null,
      fields: [],
    })

    const result = await createTeamAndRegister({
      tournamentId: TEAM_TOURNAMENT_UUID,
      returnPath: '/tournaments/pubg-duo-cup',
      teamName: 'Les Loups',
      fieldValues: {},
      donationAmount: 900,
    })

    expect(result.success).toBe(false)
    expect(result.message).toContain('10.00 CHF')
    expect(mockTeamCreate).not.toHaveBeenCalled()
    expect(mockRegistrationCreate).not.toHaveBeenCalled()
    expect(mockPaymentCreate).not.toHaveBeenCalled()
    expect(mockCheckoutCreate).not.toHaveBeenCalled()
  })
})

// ---------------------------------------------------------------------------
// joinTeamAndRegister (TEAM free — team full)
// ---------------------------------------------------------------------------

describe('joinTeamAndRegister — team full rejection', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()

    mockGetSession.mockResolvedValue({
      user: {
        id: 'user-2',
        role: Role.USER,
        email: 'user2@test.com',
        name: 'User2',
      },
      session: {
        id: 'sess-2',
        userId: 'user-2',
        token: 'tok2',
        expiresAt: '2027-01-01',
      },
    })

    mockUserFindUnique.mockResolvedValue({ bannedAt: null })

    mockTournamentFindUnique.mockResolvedValue({
      id: TEAM_TOURNAMENT_UUID,
      title: 'Team Cup',
      status: TournamentStatus.PUBLISHED,
      format: TournamentFormat.TEAM,
      startDate: new Date('2026-04-15T00:00:00.000Z'),
      endDate: new Date('2026-04-16T00:00:00.000Z'),
      registrationOpen: new Date('2026-04-01T00:00:00.000Z'),
      registrationClose: new Date('2026-05-01T00:00:00.000Z'),
      maxTeams: null,
      teamSize: 2,
      registrationType: RegistrationType.FREE,
      entryFeeAmount: null,
      entryFeeCurrency: null,
      refundPolicyType: RefundPolicyType.NONE,
      refundDeadlineDays: null,
      fields: [],
    })

    mockRegistrationFindUnique.mockResolvedValue(null)
    mockRegistrationFindFirst.mockResolvedValue(null)
    mockRegistrationFindMany.mockResolvedValue([])
    mockTxRegistrationFindUnique.mockResolvedValue({
      id: 'reg-team-2',
      status: RegistrationStatus.PENDING,
      paymentStatus: PaymentStatus.PENDING,
    })
    mockPaymentFindMany.mockResolvedValue([])
    mockRegistrationCount.mockResolvedValue(0)

    // Team exists and belongs to the tournament (outer check passes)
    mockTeamFindUnique.mockResolvedValue({
      id: TEAM_UUID,
      tournamentId: TEAM_TOURNAMENT_UUID,
      _count: { members: 1 },
    })

    // Inside transaction: team is now full (2/2)
    mockTransaction.mockImplementation(async callback => {
      return callback({
        payment: {
          updateMany: mockPaymentUpdateMany,
          create: mockPaymentCreate,
          update: mockPaymentUpdate,
        },
        tournamentRegistration: {
          count: mockRegistrationCount,
          create: mockRegistrationCreate,
          update: mockRegistrationUpdate,
          findUnique: mockTxRegistrationFindUnique,
        },
        team: {
          findUnique: vi
            .fn()
            .mockResolvedValue({ id: TEAM_UUID, _count: { members: 2 } }),
          create: mockTeamCreate,
          count: mockTeamCount,
        },
        teamMember: {
          create: mockTeamMemberCreate,
          deleteMany: mockTeamMemberDeleteMany,
          findFirst: vi.fn().mockResolvedValue(null),
          count: vi.fn().mockResolvedValue(2),
        },
      })
    })

    vi.setSystemTime(new Date('2026-04-15T12:00:00.000Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns failure when team is full at transaction time', async () => {
    const result = await joinTeamAndRegister({
      tournamentId: TEAM_TOURNAMENT_UUID,
      returnPath: '/tournaments/team-cup',
      teamId: TEAM_UUID,
      fieldValues: {},
    })

    expect(result.success).toBe(false)
    expect(result.message).toContain('complète')
  })
})

// ---------------------------------------------------------------------------
// startPaidRegistrationCheckout — Stripe failure rollback
// ---------------------------------------------------------------------------

describe('paid tournament registration — Stripe failure rollback', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()

    mockGetSession.mockResolvedValue({
      user: {
        id: 'user-1',
        role: Role.USER,
        email: 'user@test.com',
        name: 'User',
      },
      session: {
        id: 'sess-1',
        userId: 'user-1',
        token: 'tok',
        expiresAt: '2027-01-01',
      },
    })

    mockUserFindUnique.mockResolvedValue({ bannedAt: null })

    mockTournamentFindUnique.mockResolvedValue({
      id: TOURNAMENT_UUID,
      title: 'PUBG Duo Cup',
      status: TournamentStatus.PUBLISHED,
      format: TournamentFormat.SOLO,
      startDate: new Date('2026-04-15T00:00:00.000Z'),
      endDate: new Date('2026-04-16T00:00:00.000Z'),
      registrationOpen: new Date('2026-04-01T00:00:00.000Z'),
      registrationClose: new Date('2026-05-01T00:00:00.000Z'),
      maxTeams: null,
      teamSize: 1,
      registrationType: RegistrationType.PAID,
      entryFeeAmount: 500,
      entryFeeCurrency: 'CHF',
      refundPolicyType: RefundPolicyType.BEFORE_DEADLINE,
      refundDeadlineDays: 14,
      fields: [],
    })

    mockRegistrationFindUnique.mockResolvedValue(null)
    mockRegistrationFindFirst.mockResolvedValue(null)
    mockRegistrationFindMany.mockResolvedValue([])
    mockTxRegistrationFindUnique.mockResolvedValue({
      id: 'reg-1',
      status: RegistrationStatus.PENDING,
      paymentStatus: PaymentStatus.PENDING,
    })
    mockPaymentFindMany.mockResolvedValue([])
    mockRegistrationCount.mockResolvedValue(0)
    mockRegistrationCreate.mockResolvedValue({ id: 'reg-1' })
    mockPaymentCreate.mockResolvedValue({ id: 'pay-1' })

    // Stripe throws
    mockCheckoutCreate.mockRejectedValue(new Error('Stripe network error'))

    mockTransaction.mockImplementation(async callback =>
      callback({
        payment: {
          updateMany: mockPaymentUpdateMany,
          create: mockPaymentCreate,
          update: mockPaymentUpdate,
        },
        tournamentRegistration: {
          count: mockRegistrationCount,
          create: mockRegistrationCreate,
          update: mockRegistrationUpdate,
          findUnique: mockTxRegistrationFindUnique,
        },
        team: {
          findUnique: mockTeamFindUnique,
          create: mockTeamCreate,
          count: mockTeamCount,
        },
        teamMember: {
          create: mockTeamMemberCreate,
          deleteMany: mockTeamMemberDeleteMany,
          findFirst: vi.fn().mockResolvedValue(null),
        },
      }),
    )

    vi.setSystemTime(new Date('2026-04-15T12:00:00.000Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns failure and rolls back DB when Stripe checkout creation fails', async () => {
    const result = await registerForTournament({
      tournamentId: TOURNAMENT_UUID,
      returnPath: '/tournaments/pubg-duo-cup',
      fieldValues: {},
    })

    expect(result.success).toBe(false)
    expect(result.message).toContain('Stripe')
    // Rollback transaction called three times: (1) initial DB write, (2) payment create, (3) rollback
    expect(mockTransaction).toHaveBeenCalledTimes(3)
    expect(mockPaymentUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'FAILED' }),
      }),
    )
  })
})
