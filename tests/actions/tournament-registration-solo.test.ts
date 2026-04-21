/**
 * File: tests/actions/tournament-registration-solo.test.ts
 * Description: Unit tests for solo tournament registration server actions:
 *   registerForTournament, updateRegistrationFields, cancelMyPendingRegistrationForTournament.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  PaymentStatus,
  RefundPolicyType,
  RegistrationStatus,
  RegistrationType,
  Role,
  TournamentFormat,
  TournamentStatus,
} from '@/prisma/generated/prisma/enums'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TOURNAMENT_ID = '11111111-1111-4111-8111-111111111111'
const REGISTRATION_ID = '22222222-2222-4222-8222-222222222222'
const PAYMENT_ID = '33333333-3333-4333-8333-333333333333'
const USER_ID = 'user-solo-1'
const STRIPE_SESSION_ID = 'cs_test_abc123'
const RETURN_PATH = '/tournaments/test-cup'

// ---------------------------------------------------------------------------
// Mocks (must be declared before any dynamic import)
// ---------------------------------------------------------------------------

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

const mockCheckoutSessionsCreate = vi.fn()
const mockCheckoutSessionsExpire = vi.fn()
vi.mock('@/lib/core/stripe', () => ({
  getStripe: () => ({
    checkout: {
      sessions: {
        create: (...args: unknown[]) => mockCheckoutSessionsCreate(...args),
        expire: (...args: unknown[]) => mockCheckoutSessionsExpire(...args),
      },
    },
  }),
}))

const mockUserFindUnique = vi.fn()
const mockTournamentFindUnique = vi.fn()
const mockRegistrationFindUnique = vi.fn()
const mockRegistrationFindFirst = vi.fn()
const mockRegistrationCount = vi.fn()
const mockRegistrationCreate = vi.fn()
const mockRegistrationUpdate = vi.fn()
const mockPaymentFindFirst = vi.fn()
const mockPaymentUpdateMany = vi.fn()
const mockPaymentCreate = vi.fn()
const mockPaymentUpdate = vi.fn()
const mockTeamMemberDeleteMany = vi.fn()
const mockTransaction = vi.fn()

vi.mock('@/lib/core/prisma', () => ({
  default: {
    user: { findUnique: (...a: unknown[]) => mockUserFindUnique(...a) },
    tournament: {
      findUnique: (...a: unknown[]) => mockTournamentFindUnique(...a),
    },
    tournamentRegistration: {
      findUnique: (...a: unknown[]) => mockRegistrationFindUnique(...a),
      findFirst: (...a: unknown[]) => mockRegistrationFindFirst(...a),
      count: (...a: unknown[]) => mockRegistrationCount(...a),
      create: (...a: unknown[]) => mockRegistrationCreate(...a),
      update: (...a: unknown[]) => mockRegistrationUpdate(...a),
    },
    payment: {
      findFirst: (...a: unknown[]) => mockPaymentFindFirst(...a),
      updateMany: (...a: unknown[]) => mockPaymentUpdateMany(...a),
      create: (...a: unknown[]) => mockPaymentCreate(...a),
      update: (...a: unknown[]) => mockPaymentUpdate(...a),
    },
    teamMember: {
      deleteMany: (...a: unknown[]) => mockTeamMemberDeleteMany(...a),
    },
    $transaction: (...a: unknown[]) => mockTransaction(...a),
  },
}))

// ---------------------------------------------------------------------------
// Lazy import (after mocks are wired)
// ---------------------------------------------------------------------------

const {
  registerForTournament,
  updateRegistrationFields,
  cancelMyPendingRegistrationForTournament,
} = await import('@/lib/actions/tournament-registration-solo')

// ---------------------------------------------------------------------------
// Factory helpers
// ---------------------------------------------------------------------------

const makeSession = (userId = USER_ID) => ({
  user: {
    id: userId,
    role: Role.USER,
    email: 'player@test.com',
    name: 'Player',
  },
  session: { id: 'sess-1', userId, token: 'tok', expiresAt: '2027-01-01' },
})

/** A fully open, published, FREE, SOLO tournament. */
const makeFreeSoloTournament = (overrides: Record<string, unknown> = {}) => ({
  id: TOURNAMENT_ID,
  title: 'Test Cup',
  status: TournamentStatus.PUBLISHED,
  format: TournamentFormat.SOLO,
  startDate: new Date('2026-04-15T00:00:00.000Z'),
  endDate: new Date('2026-04-16T00:00:00.000Z'),
  registrationOpen: new Date('2026-04-01T00:00:00.000Z'),
  registrationClose: new Date('2026-05-01T00:00:00.000Z'),
  maxTeams: null,
  teamSize: 1,
  registrationType: RegistrationType.FREE,
  entryFeeAmount: null,
  entryFeeCurrency: null,
  refundPolicyType: RefundPolicyType.NONE,
  refundDeadlineDays: null,
  fields: [],
  ...overrides,
})

/** A standard transaction mock that executes the callback synchronously. */
const makeTxMock = () =>
  mockTransaction.mockImplementation(
    async (cb: (tx: unknown) => Promise<unknown>) =>
      cb({
        tournamentRegistration: {
          count: mockRegistrationCount,
          create: mockRegistrationCreate,
          update: mockRegistrationUpdate,
          findUnique: mockRegistrationFindUnique,
        },
        payment: {
          updateMany: mockPaymentUpdateMany,
          create: mockPaymentCreate,
          update: mockPaymentUpdate,
        },
        teamMember: {
          deleteMany: mockTeamMemberDeleteMany,
          findFirst: vi.fn().mockResolvedValue(null),
          count: vi.fn().mockResolvedValue(0),
        },
        team: { update: vi.fn() },
      }),
  )

// ===========================================================================
// registerForTournament
// ===========================================================================

describe('registerForTournament', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-04-15T12:00:00.000Z'))

    mockGetSession.mockResolvedValue(makeSession())
    mockUserFindUnique.mockResolvedValue({ bannedAt: null, bannedUntil: null })
    mockTournamentFindUnique.mockResolvedValue(makeFreeSoloTournament())
    mockRegistrationFindUnique.mockResolvedValue(null)
    mockRegistrationFindFirst.mockResolvedValue(null)
    mockRegistrationCount.mockResolvedValue(0)
    mockRegistrationCreate.mockResolvedValue({ id: REGISTRATION_ID })
    makeTxMock()
  })

  afterEach(() => vi.useRealTimers())

  it('should register successfully for a free SOLO tournament', async () => {
    const result = await registerForTournament({
      tournamentId: TOURNAMENT_ID,
      returnPath: RETURN_PATH,
      fieldValues: {},
    })

    expect(result.success).toBe(true)
    expect(result.message).toContain('enregistrée')
    expect(mockCheckoutSessionsCreate).not.toHaveBeenCalled()
  })

  it('should return error when the user is banned', async () => {
    mockUserFindUnique.mockResolvedValue({
      bannedAt: new Date('2026-01-01'),
      bannedUntil: null, // permanent ban
    })

    const result = await registerForTournament({
      tournamentId: TOURNAMENT_ID,
      returnPath: RETURN_PATH,
      fieldValues: {},
    })

    expect(result.success).toBe(false)
    expect(result.message).toContain('suspendu')
  })

  it('should return error when the tournament is not published', async () => {
    mockTournamentFindUnique.mockResolvedValue(
      makeFreeSoloTournament({ status: TournamentStatus.DRAFT }),
    )

    const result = await registerForTournament({
      tournamentId: TOURNAMENT_ID,
      returnPath: RETURN_PATH,
      fieldValues: {},
    })

    expect(result.success).toBe(false)
    expect(result.message).toContain('introuvable')
  })

  it('should return error when registration window has not opened yet', async () => {
    mockTournamentFindUnique.mockResolvedValue(
      makeFreeSoloTournament({
        registrationOpen: new Date('2026-05-01T00:00:00.000Z'),
        registrationClose: new Date('2026-06-01T00:00:00.000Z'),
      }),
    )

    const result = await registerForTournament({
      tournamentId: TOURNAMENT_ID,
      returnPath: RETURN_PATH,
      fieldValues: {},
    })

    expect(result.success).toBe(false)
    expect(result.message).toContain('ouvertes')
  })

  it('should return error when registration window is closed', async () => {
    mockTournamentFindUnique.mockResolvedValue(
      makeFreeSoloTournament({
        registrationOpen: new Date('2026-01-01T00:00:00.000Z'),
        registrationClose: new Date('2026-02-01T00:00:00.000Z'),
      }),
    )

    const result = await registerForTournament({
      tournamentId: TOURNAMENT_ID,
      returnPath: RETURN_PATH,
      fieldValues: {},
    })

    expect(result.success).toBe(false)
    expect(result.message).toContain('ouvertes')
  })

  it('should return error when user is already confirmed for this tournament', async () => {
    mockRegistrationFindUnique.mockResolvedValue({
      id: REGISTRATION_ID,
      status: RegistrationStatus.CONFIRMED,
      paymentStatus: PaymentStatus.NOT_REQUIRED,
      paymentRequiredSnapshot: false,
      expiresAt: null,
    })

    const result = await registerForTournament({
      tournamentId: TOURNAMENT_ID,
      returnPath: RETURN_PATH,
      fieldValues: {},
    })

    expect(result.success).toBe(false)
    expect(result.message).toContain('déjà inscrit')
  })

  it('should return error when user has an overlapping tournament', async () => {
    // Simulates a registration for another tournament with overlapping dates
    mockRegistrationFindFirst.mockResolvedValue({
      tournament: { title: 'Other Cup' },
    })

    const result = await registerForTournament({
      tournamentId: TOURNAMENT_ID,
      returnPath: RETURN_PATH,
      fieldValues: {},
    })

    expect(result.success).toBe(false)
    expect(result.message).toContain('même période')
  })

  it('should return error when attempting to register for a TEAM tournament via solo action', async () => {
    mockTournamentFindUnique.mockResolvedValue(
      makeFreeSoloTournament({ format: TournamentFormat.TEAM }),
    )

    const result = await registerForTournament({
      tournamentId: TOURNAMENT_ID,
      returnPath: RETURN_PATH,
      fieldValues: {},
    })

    expect(result.success).toBe(false)
    expect(result.message).toContain('format équipe')
  })

  it('should return error when the tournament is full (capacity reached)', async () => {
    mockTournamentFindUnique.mockResolvedValue(
      makeFreeSoloTournament({ maxTeams: 2 }),
    )
    // Transaction: capacity check returns count equal to maxTeams
    mockTransaction.mockImplementation(
      async (cb: (tx: unknown) => Promise<unknown>) =>
        cb({
          tournamentRegistration: {
            count: vi.fn().mockResolvedValue(2), // full
            create: mockRegistrationCreate,
            update: mockRegistrationUpdate,
          },
          payment: {
            updateMany: mockPaymentUpdateMany,
            create: mockPaymentCreate,
            update: mockPaymentUpdate,
          },
          teamMember: {
            deleteMany: mockTeamMemberDeleteMany,
            findFirst: vi.fn().mockResolvedValue(null),
          },
          team: { update: vi.fn() },
        }),
    )

    const result = await registerForTournament({
      tournamentId: TOURNAMENT_ID,
      returnPath: RETURN_PATH,
      fieldValues: {},
    })

    expect(result.success).toBe(false)
    expect(result.message).toContain('complet')
  })

  it('should not count the existing PENDING registration when checking capacity', async () => {
    // User already has a PENDING registration (expired checkout re-attempt)
    mockTournamentFindUnique.mockResolvedValue(
      makeFreeSoloTournament({ maxTeams: 1 }),
    )
    mockRegistrationFindUnique.mockResolvedValue({
      id: REGISTRATION_ID,
      status: RegistrationStatus.PENDING,
      paymentStatus: PaymentStatus.PENDING,
      paymentRequiredSnapshot: false,
      expiresAt: new Date('2026-04-14T00:00:00.000Z'), // expired
    })
    // Transaction: count excludes the user's own registration → 0 others
    mockTransaction.mockImplementation(
      async (cb: (tx: unknown) => Promise<unknown>) =>
        cb({
          tournamentRegistration: {
            count: vi.fn().mockResolvedValue(0),
            create: mockRegistrationCreate,
            update: mockRegistrationUpdate,
          },
          payment: {
            updateMany: mockPaymentUpdateMany,
            create: mockPaymentCreate,
            update: mockPaymentUpdate,
          },
          teamMember: {
            deleteMany: mockTeamMemberDeleteMany,
            findFirst: vi.fn().mockResolvedValue(null),
          },
          team: { update: vi.fn() },
        }),
    )

    const result = await registerForTournament({
      tournamentId: TOURNAMENT_ID,
      returnPath: RETURN_PATH,
      fieldValues: {},
    })

    expect(result.success).toBe(true)
  })

  it('should redirect to Stripe checkout for a PAID tournament', async () => {
    mockTournamentFindUnique.mockResolvedValue(
      makeFreeSoloTournament({
        registrationType: RegistrationType.PAID,
        entryFeeAmount: 1000,
        entryFeeCurrency: 'CHF',
        refundPolicyType: RefundPolicyType.BEFORE_DEADLINE,
        refundDeadlineDays: 7,
      }),
    )
    mockPaymentCreate.mockResolvedValue({ id: PAYMENT_ID })
    mockCheckoutSessionsCreate.mockResolvedValue({
      id: STRIPE_SESSION_ID,
      url: 'https://checkout.stripe.test/session',
      customer: null,
    })

    const result = await registerForTournament({
      tournamentId: TOURNAMENT_ID,
      returnPath: RETURN_PATH,
      fieldValues: {},
    })

    expect(result.success).toBe(true)
    expect(result.data).toEqual({
      checkoutUrl: 'https://checkout.stripe.test/session',
    })
    expect(mockCheckoutSessionsCreate).toHaveBeenCalledOnce()
    expect(mockRegistrationCreate).toHaveBeenCalledOnce()
  })

  it('should validate field values and return error for missing required fields', async () => {
    mockTournamentFindUnique.mockResolvedValue(
      makeFreeSoloTournament({
        fields: [{ label: 'Pseudo', type: 'TEXT', required: true, order: 0 }],
      }),
    )

    const result = await registerForTournament({
      tournamentId: TOURNAMENT_ID,
      returnPath: RETURN_PATH,
      fieldValues: {}, // missing required 'Pseudo'
    })

    expect(result.success).toBe(false)
    expect(result.message).toBeTruthy()
  })
})

// ===========================================================================
// updateRegistrationFields
// ===========================================================================

describe('updateRegistrationFields', () => {
  const makeRegistrationWithTournament = (
    overrides: Record<string, unknown> = {},
  ) => ({
    id: REGISTRATION_ID,
    userId: USER_ID,
    status: RegistrationStatus.CONFIRMED,
    tournamentId: TOURNAMENT_ID,
    tournament: makeFreeSoloTournament(),
    ...overrides,
  })

  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-04-15T12:00:00.000Z'))

    mockGetSession.mockResolvedValue(makeSession())
    mockRegistrationFindUnique.mockResolvedValue(
      makeRegistrationWithTournament(),
    )
    // updateRegistrationFields calls prisma.tournamentRegistration.update directly (no transaction)
    mockRegistrationUpdate.mockResolvedValue({
      id: REGISTRATION_ID,
      fieldValues: {},
    })
  })

  afterEach(() => vi.useRealTimers())

  it('should update field values successfully for the registration owner', async () => {
    // Tournament has no required fields, so an empty fieldValues object is valid
    const result = await updateRegistrationFields({
      registrationId: REGISTRATION_ID,
      tournamentId: TOURNAMENT_ID,
      fieldValues: {},
    })

    expect(result.success).toBe(true)
    expect(result.message).toContain('mise à jour')
    expect(mockRegistrationUpdate).toHaveBeenCalledOnce()
  })

  it('should return error when registration does not exist', async () => {
    mockRegistrationFindUnique.mockResolvedValue(null)

    const result = await updateRegistrationFields({
      registrationId: REGISTRATION_ID,
      tournamentId: TOURNAMENT_ID,
      fieldValues: {},
    })

    expect(result.success).toBe(false)
    expect(result.message).toContain('introuvable')
  })

  it('should return error when the session user does not own the registration', async () => {
    mockRegistrationFindUnique.mockResolvedValue(
      makeRegistrationWithTournament({ userId: 'other-user-id' }),
    )

    const result = await updateRegistrationFields({
      registrationId: REGISTRATION_ID,
      tournamentId: TOURNAMENT_ID,
      fieldValues: {},
    })

    expect(result.success).toBe(false)
    expect(result.message).toContain('autre joueur')
  })

  it('should return error when tournamentId in payload does not match registration', async () => {
    const OTHER_TOURNAMENT_ID = '99999999-9999-4999-8999-999999999999'
    mockRegistrationFindUnique.mockResolvedValue(
      makeRegistrationWithTournament(),
    )

    const result = await updateRegistrationFields({
      registrationId: REGISTRATION_ID,
      tournamentId: OTHER_TOURNAMENT_ID,
      fieldValues: {},
    })

    expect(result.success).toBe(false)
    expect(result.message).toContain('invalide')
  })

  it('should return error when registration status is CANCELLED', async () => {
    mockRegistrationFindUnique.mockResolvedValue(
      makeRegistrationWithTournament({ status: RegistrationStatus.CANCELLED }),
    )

    const result = await updateRegistrationFields({
      registrationId: REGISTRATION_ID,
      tournamentId: TOURNAMENT_ID,
      fieldValues: {},
    })

    expect(result.success).toBe(false)
    expect(result.message).toContain('ne peut plus être modifiée')
  })

  it('should return error when registration status is EXPIRED', async () => {
    mockRegistrationFindUnique.mockResolvedValue(
      makeRegistrationWithTournament({ status: RegistrationStatus.EXPIRED }),
    )

    const result = await updateRegistrationFields({
      registrationId: REGISTRATION_ID,
      tournamentId: TOURNAMENT_ID,
      fieldValues: {},
    })

    expect(result.success).toBe(false)
    expect(result.message).toContain('ne peut plus être modifiée')
  })

  it('should return error when the tournament is not published', async () => {
    mockRegistrationFindUnique.mockResolvedValue(
      makeRegistrationWithTournament({
        tournament: makeFreeSoloTournament({
          status: TournamentStatus.ARCHIVED,
        }),
      }),
    )

    const result = await updateRegistrationFields({
      registrationId: REGISTRATION_ID,
      tournamentId: TOURNAMENT_ID,
      fieldValues: {},
    })

    expect(result.success).toBe(false)
    expect(result.message).toContain('indisponible')
  })

  it('should return error when registration window is closed', async () => {
    mockRegistrationFindUnique.mockResolvedValue(
      makeRegistrationWithTournament({
        tournament: makeFreeSoloTournament({
          registrationClose: new Date('2026-03-01T00:00:00.000Z'), // in the past
        }),
      }),
    )

    const result = await updateRegistrationFields({
      registrationId: REGISTRATION_ID,
      tournamentId: TOURNAMENT_ID,
      fieldValues: {},
    })

    expect(result.success).toBe(false)
    expect(result.message).toContain('fermées')
  })

  it('should accept a PENDING registration and update it', async () => {
    mockRegistrationFindUnique.mockResolvedValue(
      makeRegistrationWithTournament({ status: RegistrationStatus.PENDING }),
    )

    const result = await updateRegistrationFields({
      registrationId: REGISTRATION_ID,
      tournamentId: TOURNAMENT_ID,
      fieldValues: {},
    })

    expect(result.success).toBe(true)
  })
})

// ===========================================================================
// cancelMyPendingRegistrationForTournament
// ===========================================================================

describe('cancelMyPendingRegistrationForTournament', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-04-15T12:00:00.000Z'))

    mockGetSession.mockResolvedValue(makeSession())
    mockRegistrationFindUnique.mockResolvedValue({
      id: REGISTRATION_ID,
      status: RegistrationStatus.PENDING,
      teamId: null,
    })
    mockPaymentFindFirst.mockResolvedValue({
      id: PAYMENT_ID,
      stripeCheckoutSessionId: STRIPE_SESSION_ID,
    })
    mockCheckoutSessionsExpire.mockResolvedValue({})
    makeTxMock()
  })

  afterEach(() => vi.useRealTimers())

  it('should cancel a pending registration and expire the Stripe session', async () => {
    const result = await cancelMyPendingRegistrationForTournament({
      tournamentId: TOURNAMENT_ID,
    })

    expect(result.success).toBe(true)
    expect(mockCheckoutSessionsExpire).toHaveBeenCalledWith(STRIPE_SESSION_ID)
    expect(mockRegistrationUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: RegistrationStatus.EXPIRED }),
      }),
    )
  })

  it('should succeed idempotently when no PENDING registration exists', async () => {
    mockRegistrationFindUnique.mockResolvedValue(null)

    const result = await cancelMyPendingRegistrationForTournament({
      tournamentId: TOURNAMENT_ID,
    })

    expect(result.success).toBe(true)
    expect(result.message).toContain('Aucune inscription')
    expect(mockCheckoutSessionsExpire).not.toHaveBeenCalled()
  })

  it('should succeed idempotently when registration exists but is not PENDING', async () => {
    mockRegistrationFindUnique.mockResolvedValue({
      id: REGISTRATION_ID,
      status: RegistrationStatus.CONFIRMED, // already confirmed
      teamId: null,
    })

    const result = await cancelMyPendingRegistrationForTournament({
      tournamentId: TOURNAMENT_ID,
    })

    expect(result.success).toBe(true)
    expect(mockCheckoutSessionsExpire).not.toHaveBeenCalled()
  })

  it('should still cancel registration even when Stripe session expiry fails', async () => {
    // Stripe expiry is best-effort: failure must not abort the cancellation
    mockCheckoutSessionsExpire.mockRejectedValue(new Error('Stripe error'))

    const result = await cancelMyPendingRegistrationForTournament({
      tournamentId: TOURNAMENT_ID,
    })

    expect(result.success).toBe(true)
    expect(mockRegistrationUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: RegistrationStatus.EXPIRED }),
      }),
    )
  })

  it('should cancel the pending payment record within the transaction', async () => {
    const result = await cancelMyPendingRegistrationForTournament({
      tournamentId: TOURNAMENT_ID,
    })

    expect(result.success).toBe(true)
    expect(mockPaymentUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: PAYMENT_ID },
        data: expect.objectContaining({ status: PaymentStatus.CANCELLED }),
      }),
    )
  })

  it('should cancel registration without touching Stripe when no payment record exists', async () => {
    mockPaymentFindFirst.mockResolvedValue(null)

    const result = await cancelMyPendingRegistrationForTournament({
      tournamentId: TOURNAMENT_ID,
    })

    expect(result.success).toBe(true)
    expect(mockCheckoutSessionsExpire).not.toHaveBeenCalled()
    expect(mockPaymentUpdate).not.toHaveBeenCalled()
  })
})
