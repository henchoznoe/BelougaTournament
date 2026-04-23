/**
 * File: tests/actions/tournament-registration-helpers.test.ts
 * Description: Unit tests for shared tournament registration helper functions.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MINUTE_IN_MS, REGISTRATION_HOLD_MINUTES } from '@/lib/config/constants'
import {
  DonationType,
  FieldType,
  PaymentStatus,
  RefundPolicyType,
  RegistrationStatus,
  RegistrationType,
  TournamentFormat,
  TournamentStatus,
} from '@/prisma/generated/prisma/enums'

vi.mock('server-only', () => ({}))

vi.mock('@/lib/core/env', () => ({
  env: { NEXT_PUBLIC_APP_URL: 'https://belouga.test' },
}))

vi.mock('@/lib/core/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}))

const mockCleanupExpiredPendingRegistrations = vi.fn()
vi.mock('@/lib/utils/registration-expiry', () => ({
  cleanupExpiredPendingRegistrations: (...args: unknown[]) =>
    mockCleanupExpiredPendingRegistrations(...args),
}))

const mockRemoveUserFromTeam = vi.fn()
vi.mock('@/lib/utils/team', () => ({
  removeUserFromTeam: (...args: unknown[]) => mockRemoveUserFromTeam(...args),
}))

const mockCheckoutExpire = vi.fn()
const mockCheckoutCreate = vi.fn()
vi.mock('@/lib/core/stripe', () => ({
  getStripe: () => ({
    checkout: {
      sessions: {
        expire: (...args: unknown[]) => mockCheckoutExpire(...args),
        create: (...args: unknown[]) => mockCheckoutCreate(...args),
      },
    },
  }),
}))

const mockUserFindUnique = vi.fn()
const mockTournamentFindUnique = vi.fn()
const mockRegistrationFindUnique = vi.fn()
const mockRegistrationFindFirst = vi.fn()
const mockRegistrationCreate = vi.fn()
const mockRegistrationUpdate = vi.fn()
const mockPaymentFindMany = vi.fn()
const mockPaymentUpdate = vi.fn()
const mockPaymentUpdateMany = vi.fn()
const mockPaymentCreate = vi.fn()
const mockTransaction = vi.fn()

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
      create: (...args: unknown[]) => mockRegistrationCreate(...args),
      update: (...args: unknown[]) => mockRegistrationUpdate(...args),
    },
    payment: {
      findMany: (...args: unknown[]) => mockPaymentFindMany(...args),
      update: (...args: unknown[]) => mockPaymentUpdate(...args),
      updateMany: (...args: unknown[]) => mockPaymentUpdateMany(...args),
      create: (...args: unknown[]) => mockPaymentCreate(...args),
    },
    $transaction: (...args: unknown[]) => mockTransaction(...args),
  },
}))

const USER_ID = 'user-1'
const TOURNAMENT_ID = 'tournament-1'
const EXISTING_REGISTRATION_ID = 'registration-existing'
const OVERLAPPING_TITLE = 'Other Cup'
const RETURN_PATH = '/tournaments/belouga-cup'
const NOW = new Date('2026-04-23T12:00:00.000Z')
const REGISTRATION_OPEN = new Date('2026-04-01T00:00:00.000Z')
const REGISTRATION_CLOSE = new Date('2026-05-01T00:00:00.000Z')
const START_DATE = new Date('2026-06-01T10:00:00.000Z')
const END_DATE = new Date('2026-06-02T18:00:00.000Z')
const FIELD_VALUES = { 'Riot ID': 'belouga#1234' }

const {
  fetchTournamentForRegistration,
  startPaidRegistrationCheckout,
  upsertRegistrationAttempt,
} = await import('@/lib/actions/tournament-registration-helpers')

type UpsertArgs = Parameters<typeof upsertRegistrationAttempt>[0]
type TournamentForHelpers = UpsertArgs['tournament']

interface UpsertTransactionMock {
  tournamentRegistration: {
    create: ReturnType<typeof vi.fn>
    update: ReturnType<typeof vi.fn>
  }
}

const createTournament = (
  overrides: Partial<{
    status: TournamentStatus
    registrationOpen: Date
    registrationClose: Date
    format: TournamentFormat
    registrationType: RegistrationType
    entryFeeAmount: number | null
    entryFeeCurrency: string | null
    donationEnabled: boolean
    donationType: DonationType | null
    donationFixedAmount: number | null
    donationMinAmount: number | null
    refundDeadlineDays: number | null
    maxTeams: number | null
    teamSize: number
  }> = {},
): TournamentForHelpers => ({
  id: TOURNAMENT_ID,
  title: 'Belouga Cup',
  status: overrides.status ?? TournamentStatus.PUBLISHED,
  format: overrides.format ?? TournamentFormat.SOLO,
  startDate: START_DATE,
  endDate: END_DATE,
  registrationOpen: overrides.registrationOpen ?? REGISTRATION_OPEN,
  registrationClose: overrides.registrationClose ?? REGISTRATION_CLOSE,
  maxTeams: overrides.maxTeams ?? null,
  teamSize: overrides.teamSize ?? 1,
  registrationType: overrides.registrationType ?? RegistrationType.FREE,
  entryFeeAmount: overrides.entryFeeAmount ?? null,
  entryFeeCurrency: overrides.entryFeeCurrency ?? null,
  refundPolicyType: RefundPolicyType.BEFORE_DEADLINE,
  refundDeadlineDays: overrides.refundDeadlineDays ?? 14,
  donationEnabled: overrides.donationEnabled ?? false,
  donationType: overrides.donationType ?? null,
  donationFixedAmount: overrides.donationFixedAmount ?? null,
  donationMinAmount: overrides.donationMinAmount ?? null,
  fields: [
    {
      label: 'Riot ID',
      type: FieldType.TEXT,
      required: true,
      order: 0,
    },
  ],
})

const createExistingRegistration = (
  overrides: Partial<{
    status: RegistrationStatus
    paymentStatus: PaymentStatus
    paymentRequiredSnapshot: boolean
    expiresAt: Date | null
  }> = {},
) => ({
  id: EXISTING_REGISTRATION_ID,
  status: overrides.status ?? RegistrationStatus.PENDING,
  paymentStatus: overrides.paymentStatus ?? PaymentStatus.PENDING,
  paymentRequiredSnapshot: overrides.paymentRequiredSnapshot ?? false,
  expiresAt: overrides.expiresAt ?? null,
})

const createUpsertTransaction = (): UpsertTransactionMock => ({
  tournamentRegistration: {
    create: vi.fn().mockResolvedValue({ id: 'registration-new' }),
    update: vi.fn().mockResolvedValue({ id: EXISTING_REGISTRATION_ID }),
  },
})

const toUpsertTransaction = (tx: UpsertTransactionMock): UpsertArgs['tx'] =>
  tx as unknown as UpsertArgs['tx']

describe('fetchTournamentForRegistration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    vi.setSystemTime(NOW)

    mockUserFindUnique.mockResolvedValue({ bannedAt: null, bannedUntil: null })
    mockCleanupExpiredPendingRegistrations.mockResolvedValue(0)
    mockTournamentFindUnique.mockResolvedValue(createTournament())
    mockRegistrationFindUnique.mockResolvedValue(null)
    mockRegistrationFindFirst.mockResolvedValue(null)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should reject users with an active ban before running registration cleanup', async () => {
    mockUserFindUnique.mockResolvedValue({
      bannedAt: new Date('2026-04-20T00:00:00.000Z'),
      bannedUntil: new Date('2026-05-20T00:00:00.000Z'),
    })

    const result = await fetchTournamentForRegistration(USER_ID, TOURNAMENT_ID)

    expect(result).toEqual({
      error: {
        success: false,
        message:
          'Votre compte est suspendu. Vous ne pouvez pas vous inscrire à des tournois.',
      },
    })
    expect(mockCleanupExpiredPendingRegistrations).not.toHaveBeenCalled()
  })

  it('should reject users with a permanent ban when bannedUntil is null', async () => {
    mockUserFindUnique.mockResolvedValue({
      bannedAt: new Date('2026-04-20T00:00:00.000Z'),
      bannedUntil: null,
    })

    const result = await fetchTournamentForRegistration(USER_ID, TOURNAMENT_ID)

    expect(result).toEqual({
      error: {
        success: false,
        message:
          'Votre compte est suspendu. Vous ne pouvez pas vous inscrire à des tournois.',
      },
    })
  })

  it('should ignore expired bans and continue with registration pre-checks', async () => {
    const tournament = createTournament()
    mockUserFindUnique.mockResolvedValue({
      bannedAt: new Date('2026-04-20T00:00:00.000Z'),
      bannedUntil: new Date('2026-04-21T00:00:00.000Z'),
    })
    mockTournamentFindUnique.mockResolvedValue(tournament)

    const result = await fetchTournamentForRegistration(USER_ID, TOURNAMENT_ID)

    expect(result).toEqual({
      tournament,
      existingRegistration: null,
    })
  })

  it('should reject unpublished tournaments', async () => {
    mockTournamentFindUnique.mockResolvedValue(
      createTournament({ status: TournamentStatus.DRAFT }),
    )

    const result = await fetchTournamentForRegistration(USER_ID, TOURNAMENT_ID)

    expect(result).toEqual({
      error: {
        success: false,
        message: 'Ce tournoi est introuvable ou indisponible.',
      },
    })
  })

  it('should reject tournaments when the registration window is closed', async () => {
    mockTournamentFindUnique.mockResolvedValue(
      createTournament({
        registrationClose: new Date('2026-04-10T00:00:00.000Z'),
      }),
    )

    const result = await fetchTournamentForRegistration(USER_ID, TOURNAMENT_ID)

    expect(result).toEqual({
      error: {
        success: false,
        message: 'Les inscriptions ne sont pas ouvertes.',
      },
    })
  })

  it('should reject users who already have a confirmed registration for the tournament', async () => {
    mockRegistrationFindUnique.mockResolvedValue(
      createExistingRegistration({
        status: RegistrationStatus.CONFIRMED,
        paymentStatus: PaymentStatus.NOT_REQUIRED,
      }),
    )

    const result = await fetchTournamentForRegistration(USER_ID, TOURNAMENT_ID)

    expect(result).toEqual({
      error: {
        success: false,
        message: 'Vous êtes déjà inscrit à ce tournoi.',
      },
    })
  })

  it('should reject users with an overlapping active registration', async () => {
    mockRegistrationFindFirst.mockResolvedValue({
      tournament: { title: OVERLAPPING_TITLE },
    })

    const result = await fetchTournamentForRegistration(USER_ID, TOURNAMENT_ID)

    expect(result).toEqual({
      error: {
        success: false,
        message:
          'Vous êtes déjà inscrit à un tournoi qui se déroule pendant la même période.',
      },
    })
  })

  it('should return the tournament and existing pending registration when all checks pass', async () => {
    const tournament = createTournament({
      registrationType: RegistrationType.PAID,
      entryFeeAmount: 1500,
      entryFeeCurrency: 'CHF',
    })
    const existingRegistration = createExistingRegistration()
    mockTournamentFindUnique.mockResolvedValue(tournament)
    mockRegistrationFindUnique.mockResolvedValue(existingRegistration)

    const result = await fetchTournamentForRegistration(USER_ID, TOURNAMENT_ID)

    expect(result).toEqual({
      tournament,
      existingRegistration,
    })
    expect(mockCleanupExpiredPendingRegistrations).toHaveBeenCalledWith(USER_ID)
  })
})

describe('upsertRegistrationAttempt', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(NOW)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should create a confirmed registration immediately for free tournaments', async () => {
    const tx = createUpsertTransaction()

    await upsertRegistrationAttempt({
      tx: toUpsertTransaction(tx),
      existingRegistration: null,
      tournament: createTournament(),
      userId: USER_ID,
      fieldValues: FIELD_VALUES,
      teamId: null,
    })

    expect(tx.tournamentRegistration.create).toHaveBeenCalledWith({
      data: {
        tournamentId: TOURNAMENT_ID,
        userId: USER_ID,
        fieldValues: FIELD_VALUES,
        teamId: null,
        status: RegistrationStatus.CONFIRMED,
        paymentStatus: PaymentStatus.NOT_REQUIRED,
        paymentRequiredSnapshot: false,
        entryFeeAmountSnapshot: null,
        entryFeeCurrencySnapshot: null,
        refundDeadlineDaysSnapshot: null,
        confirmedAt: NOW,
        expiresAt: null,
      },
    })
  })

  it('should update an existing registration to pending for paid tournaments', async () => {
    const tx = createUpsertTransaction()
    const paidTournament = createTournament({
      registrationType: RegistrationType.PAID,
      entryFeeAmount: 1500,
      entryFeeCurrency: 'CHF',
      refundDeadlineDays: 21,
    })

    await upsertRegistrationAttempt({
      tx: toUpsertTransaction(tx),
      existingRegistration: createExistingRegistration(),
      tournament: paidTournament,
      userId: USER_ID,
      fieldValues: FIELD_VALUES,
      teamId: 'team-1',
    })

    expect(tx.tournamentRegistration.update).toHaveBeenCalledWith({
      where: { id: EXISTING_REGISTRATION_ID },
      data: {
        fieldValues: FIELD_VALUES,
        teamId: 'team-1',
        status: RegistrationStatus.PENDING,
        paymentStatus: PaymentStatus.PENDING,
        paymentRequiredSnapshot: true,
        entryFeeAmountSnapshot: 1500,
        entryFeeCurrencySnapshot: 'CHF',
        refundDeadlineDaysSnapshot: 21,
        confirmedAt: null,
        cancelledAt: null,
        expiresAt: new Date(
          NOW.getTime() + REGISTRATION_HOLD_MINUTES * MINUTE_IN_MS,
        ),
      },
    })
  })
})

describe('startPaidRegistrationCheckout', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const createPaidTournament = (
    overrides: Partial<TournamentForHelpers> = {},
  ): TournamentForHelpers =>
    createTournament({
      registrationType: RegistrationType.PAID,
      entryFeeAmount: 1500,
      entryFeeCurrency: 'CHF',
      ...overrides,
    })

  const createCheckoutTransaction = (
    currentRegistration: {
      id: string
      status: RegistrationStatus
      paymentStatus: PaymentStatus
    } | null,
  ) => {
    mockTransaction.mockImplementation(
      async (callback: (tx: unknown) => Promise<unknown>) =>
        callback({
          tournamentRegistration: {
            findUnique: vi.fn().mockResolvedValue(currentRegistration),
            update: mockRegistrationUpdate,
          },
          payment: {
            updateMany: mockPaymentUpdateMany,
            create: mockPaymentCreate,
            update: mockPaymentUpdate,
          },
        }),
    )
  }

  it('should fail fast when the paid tournament is missing Stripe pricing configuration', async () => {
    const result = await startPaidRegistrationCheckout({
      registrationId: EXISTING_REGISTRATION_ID,
      tournament: createTournament({
        registrationType: RegistrationType.PAID,
        entryFeeAmount: 1500,
        entryFeeCurrency: null,
      }),
      userId: USER_ID,
      returnPath: RETURN_PATH,
    })

    expect(result).toEqual({
      success: false,
      message:
        "Le paiement Stripe n'est pas correctement configuré pour ce tournoi.",
    })
    expect(mockPaymentFindMany).not.toHaveBeenCalled()
    expect(mockTransaction).not.toHaveBeenCalled()
    expect(mockCheckoutCreate).not.toHaveBeenCalled()
    expect(mockRemoveUserFromTeam).not.toHaveBeenCalled()
  })

  it('should return the donation validation error before touching Stripe state', async () => {
    const result = await startPaidRegistrationCheckout({
      registrationId: EXISTING_REGISTRATION_ID,
      tournament: createPaidTournament({
        donationEnabled: true,
        donationType: DonationType.FIXED,
        donationFixedAmount: 500,
        donationMinAmount: null,
      }),
      userId: USER_ID,
      returnPath: RETURN_PATH,
      donationAmount: 400,
    })

    expect(result).toEqual({
      success: false,
      message: 'Le don doit être de 5.00 CHF.',
    })
    expect(mockPaymentFindMany).not.toHaveBeenCalled()
  })

  it('should ignore pending payments without a checkout session id before creating a new checkout', async () => {
    mockPaymentFindMany.mockResolvedValue([{ stripeCheckoutSessionId: null }])
    createCheckoutTransaction({
      id: EXISTING_REGISTRATION_ID,
      status: RegistrationStatus.PENDING,
      paymentStatus: PaymentStatus.PENDING,
    })
    mockPaymentCreate.mockResolvedValue({ id: 'payment-1' })
    mockCheckoutCreate.mockResolvedValue({
      id: 'cs_test_1',
      url: 'https://checkout.stripe.test/session',
      customer: null,
    })

    const result = await startPaidRegistrationCheckout({
      registrationId: EXISTING_REGISTRATION_ID,
      tournament: createPaidTournament(),
      userId: USER_ID,
      returnPath: RETURN_PATH,
    })

    expect(result).toEqual({
      success: true,
      message: 'Redirection vers Stripe…',
      data: { checkoutUrl: 'https://checkout.stripe.test/session' },
    })
    expect(mockCheckoutExpire).not.toHaveBeenCalled()
  })

  it('should build checkout URLs with an ampersand when the return path already contains a query string', async () => {
    mockPaymentFindMany.mockResolvedValue([])
    createCheckoutTransaction({
      id: EXISTING_REGISTRATION_ID,
      status: RegistrationStatus.PENDING,
      paymentStatus: PaymentStatus.PENDING,
    })
    mockPaymentCreate.mockResolvedValue({ id: 'payment-1' })
    mockCheckoutCreate.mockResolvedValue({
      id: 'cs_test_3',
      url: 'https://checkout.stripe.test/session-3',
      customer: { id: 'cus_obj' },
    })

    const result = await startPaidRegistrationCheckout({
      registrationId: EXISTING_REGISTRATION_ID,
      tournament: {
        ...createPaidTournament(),
        title: undefined as unknown as string,
      },
      userId: USER_ID,
      returnPath: `${RETURN_PATH}?foo=bar`,
    })

    expect(result.success).toBe(true)
    expect(mockCheckoutCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        success_url:
          'https://belouga.test/tournaments/belouga-cup?foo=bar&stripe=success',
        cancel_url:
          'https://belouga.test/tournaments/belouga-cup?foo=bar&stripe=cancelled',
        line_items: [
          expect.objectContaining({
            price_data: expect.objectContaining({
              product_data: { name: 'Inscription - Tournoi' },
            }),
          }),
        ],
      }),
      { idempotencyKey: 'payment-1' },
    )
    expect(mockPaymentUpdate).toHaveBeenCalledWith({
      where: { id: 'payment-1' },
      data: {
        status: PaymentStatus.PENDING,
        stripeCheckoutSessionId: 'cs_test_3',
        stripeCustomerId: null,
      },
    })
  })

  it('should persist a string Stripe customer id when Stripe returns one', async () => {
    mockPaymentFindMany.mockResolvedValue([])
    createCheckoutTransaction({
      id: EXISTING_REGISTRATION_ID,
      status: RegistrationStatus.PENDING,
      paymentStatus: PaymentStatus.PENDING,
    })
    mockPaymentCreate.mockResolvedValue({ id: 'payment-2' })
    mockCheckoutCreate.mockResolvedValue({
      id: 'cs_test_4',
      url: 'https://checkout.stripe.test/session-4',
      customer: 'cus_string',
    })

    const result = await startPaidRegistrationCheckout({
      registrationId: EXISTING_REGISTRATION_ID,
      tournament: createPaidTournament(),
      userId: USER_ID,
      returnPath: RETURN_PATH,
    })

    expect(result.success).toBe(true)
    expect(mockPaymentUpdate).toHaveBeenCalledWith({
      where: { id: 'payment-2' },
      data: {
        status: PaymentStatus.PENDING,
        stripeCheckoutSessionId: 'cs_test_4',
        stripeCustomerId: 'cus_string',
      },
    })
  })

  it('should continue checkout creation when expiring an old Stripe session fails', async () => {
    mockPaymentFindMany.mockResolvedValue([
      { stripeCheckoutSessionId: 'cs_old_pending' },
    ])
    mockCheckoutExpire.mockRejectedValue(new Error('session already closed'))
    createCheckoutTransaction({
      id: EXISTING_REGISTRATION_ID,
      status: RegistrationStatus.PENDING,
      paymentStatus: PaymentStatus.PENDING,
    })
    mockPaymentCreate.mockResolvedValue({ id: 'payment-1' })
    mockCheckoutCreate.mockResolvedValue({
      id: 'cs_test_2',
      url: 'https://checkout.stripe.test/session-2',
      customer: null,
    })

    const result = await startPaidRegistrationCheckout({
      registrationId: EXISTING_REGISTRATION_ID,
      tournament: createPaidTournament(),
      userId: USER_ID,
      returnPath: RETURN_PATH,
    })

    expect(result).toEqual({
      success: true,
      message: 'Redirection vers Stripe…',
      data: { checkoutUrl: 'https://checkout.stripe.test/session-2' },
    })
    expect(mockCheckoutExpire).toHaveBeenCalledWith('cs_old_pending')
  })

  it('should return a friendly error when the registration no longer exists inside the transaction', async () => {
    mockPaymentFindMany.mockResolvedValue([])
    createCheckoutTransaction(null)

    const result = await startPaidRegistrationCheckout({
      registrationId: EXISTING_REGISTRATION_ID,
      tournament: createPaidTournament(),
      userId: USER_ID,
      returnPath: RETURN_PATH,
    })

    expect(result).toEqual({
      success: false,
      message: 'Inscription introuvable.',
    })
  })

  it('should return a friendly error when the registration is already confirmed', async () => {
    mockPaymentFindMany.mockResolvedValue([])
    createCheckoutTransaction({
      id: EXISTING_REGISTRATION_ID,
      status: RegistrationStatus.CONFIRMED,
      paymentStatus: PaymentStatus.PENDING,
    })

    const result = await startPaidRegistrationCheckout({
      registrationId: EXISTING_REGISTRATION_ID,
      tournament: createPaidTournament(),
      userId: USER_ID,
      returnPath: RETURN_PATH,
    })

    expect(result).toEqual({
      success: false,
      message: 'Votre inscription est déjà confirmée.',
    })
  })

  it('should return a friendly error when the registration payment is already marked as paid', async () => {
    mockPaymentFindMany.mockResolvedValue([])
    createCheckoutTransaction({
      id: EXISTING_REGISTRATION_ID,
      status: RegistrationStatus.PENDING,
      paymentStatus: PaymentStatus.PAID,
    })

    const result = await startPaidRegistrationCheckout({
      registrationId: EXISTING_REGISTRATION_ID,
      tournament: createPaidTournament(),
      userId: USER_ID,
      returnPath: RETURN_PATH,
    })

    expect(result).toEqual({
      success: false,
      message: 'Votre inscription est déjà confirmée.',
    })
  })

  it('should return a checkout creation error when Stripe does not provide a URL', async () => {
    mockPaymentFindMany.mockResolvedValue([])
    createCheckoutTransaction({
      id: EXISTING_REGISTRATION_ID,
      status: RegistrationStatus.PENDING,
      paymentStatus: PaymentStatus.PENDING,
    })
    mockPaymentCreate.mockResolvedValue({ id: 'payment-1' })
    mockCheckoutCreate.mockResolvedValue({
      id: 'cs_test_1',
      url: null,
      customer: null,
    })

    const result = await startPaidRegistrationCheckout({
      registrationId: EXISTING_REGISTRATION_ID,
      tournament: createPaidTournament(),
      userId: USER_ID,
      returnPath: RETURN_PATH,
    })

    expect(result).toEqual({
      success: false,
      message: 'Impossible de créer la session de paiement Stripe.',
    })
    expect(mockRemoveUserFromTeam).toHaveBeenCalledOnce()
    expect(mockPaymentUpdate).toHaveBeenCalledWith({
      where: { id: 'payment-1' },
      data: { status: PaymentStatus.FAILED },
    })
    expect(mockRegistrationUpdate).toHaveBeenCalledWith({
      where: { id: EXISTING_REGISTRATION_ID },
      data: expect.objectContaining({
        status: RegistrationStatus.EXPIRED,
        paymentStatus: PaymentStatus.FAILED,
        teamId: null,
      }),
    })
  })

  it('should rethrow unexpected transaction errors', async () => {
    mockPaymentFindMany.mockResolvedValue([])
    mockTransaction.mockRejectedValue(new Error('transaction exploded'))

    await expect(
      startPaidRegistrationCheckout({
        registrationId: EXISTING_REGISTRATION_ID,
        tournament: createPaidTournament(),
        userId: USER_ID,
        returnPath: RETURN_PATH,
      }),
    ).rejects.toThrow('transaction exploded')
  })
})
