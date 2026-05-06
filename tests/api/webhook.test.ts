/**
 * File: tests/api/webhook.test.ts
 * Description: Unit tests for the Stripe webhook API route.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Prisma } from '@/prisma/generated/prisma/client'
import {
  PaymentStatus,
  RegistrationStatus,
} from '@/prisma/generated/prisma/enums'

vi.mock('server-only', () => ({}))

const mockRevalidateTag = vi.fn()
vi.mock('next/cache', () => ({
  revalidateTag: (...args: unknown[]) => mockRevalidateTag(...args),
}))

const mockLoggerInfo = vi.fn()
const mockLoggerWarn = vi.fn()
const mockLoggerError = vi.fn()
vi.mock('@/lib/core/logger', () => ({
  logger: {
    info: (...args: unknown[]) => mockLoggerInfo(...args),
    warn: (...args: unknown[]) => mockLoggerWarn(...args),
    error: (...args: unknown[]) => mockLoggerError(...args),
  },
}))

vi.mock('@/lib/core/env', () => ({
  env: {
    NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
    NODE_ENV: 'test',
  },
}))

const mockRemoveUserFromTeam = vi.fn()
vi.mock('@/lib/utils/team', () => ({
  removeUserFromTeam: (...args: unknown[]) => mockRemoveUserFromTeam(...args),
}))

const mockConstructEvent = vi.fn()
const mockPaymentIntentRetrieve = vi.fn()
const mockBalanceTransactionRetrieve = vi.fn()
vi.mock('@/lib/core/stripe', () => ({
  getStripe: () => ({
    webhooks: {
      constructEvent: (...args: unknown[]) => mockConstructEvent(...args),
    },
    paymentIntents: {
      retrieve: (...args: unknown[]) => mockPaymentIntentRetrieve(...args),
    },
    balanceTransactions: {
      retrieve: (...args: unknown[]) => mockBalanceTransactionRetrieve(...args),
    },
  }),
  getStripeWebhookSecret: () => 'whsec_test',
}))

const mockWebhookFindUnique = vi.fn()
const mockWebhookCreate = vi.fn()
const mockWebhookDelete = vi.fn()
const mockPaymentFindUnique = vi.fn()
const mockPaymentFindFirst = vi.fn()
const mockPaymentUpdate = vi.fn()
const mockRegistrationUpdate = vi.fn()
const mockTransaction = vi.fn()

vi.mock('@/lib/core/prisma', () => ({
  default: {
    stripeWebhookEvent: {
      findUnique: (...args: unknown[]) => mockWebhookFindUnique(...args),
      create: (...args: unknown[]) => mockWebhookCreate(...args),
      delete: (...args: unknown[]) => mockWebhookDelete(...args),
    },
    payment: {
      findUnique: (...args: unknown[]) => mockPaymentFindUnique(...args),
      findFirst: (...args: unknown[]) => mockPaymentFindFirst(...args),
      update: (...args: unknown[]) => mockPaymentUpdate(...args),
    },
    tournamentRegistration: {
      update: (...args: unknown[]) => mockRegistrationUpdate(...args),
    },
    $transaction: (...args: unknown[]) => mockTransaction(...args),
  },
}))

const { POST } = await import('@/app/api/webhook/route')

const PAYMENT_ID = 'pay-1'
const REGISTRATION_ID = 'reg-1'
const TOURNAMENT_ID = 'tourn-1'
const USER_ID = 'user-1'
const STRIPE_SIGNATURE = 'sig_test'
const PAYMENT_AMOUNT = 1500
const CHARGE_ID = 'ch_123'
const PAYMENT_INTENT_ID = 'pi_123'
const STRIPE_CUSTOMER_ID = 'cus_123'
const STRIPE_FEE_AMOUNT = 123

const makeWebhookRequest = (signature = STRIPE_SIGNATURE) =>
  new Request('http://localhost:3000/api/webhook', {
    method: 'POST',
    headers: signature ? { 'stripe-signature': signature } : {},
    body: JSON.stringify({}),
  })

const createPendingPaymentRecord = () => ({
  id: PAYMENT_ID,
  status: PaymentStatus.PENDING,
  amount: PAYMENT_AMOUNT,
  currency: 'CHF',
  registration: {
    id: REGISTRATION_ID,
    status: RegistrationStatus.PENDING,
    paymentStatus: PaymentStatus.PENDING,
  },
})

describe('POST /api/webhook', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    mockWebhookFindUnique.mockResolvedValue(null)
    mockWebhookCreate.mockResolvedValue({ id: 'stored-event' })
    mockWebhookDelete.mockResolvedValue(undefined)
    mockPaymentIntentRetrieve.mockResolvedValue({ latest_charge: CHARGE_ID })
    mockBalanceTransactionRetrieve.mockResolvedValue({ fee: STRIPE_FEE_AMOUNT })
    mockPaymentFindUnique.mockResolvedValue(createPendingPaymentRecord())
    mockPaymentFindFirst.mockResolvedValue({
      id: PAYMENT_ID,
      registration: {
        id: REGISTRATION_ID,
        userId: USER_ID,
        tournamentId: TOURNAMENT_ID,
      },
    })
    mockTransaction.mockImplementation(async callback =>
      callback({
        payment: { update: mockPaymentUpdate },
        tournamentRegistration: { update: mockRegistrationUpdate },
      }),
    )
    mockRevalidateTag.mockReturnValue(undefined)
  })

  it('confirms a pending registration on checkout completion', async () => {
    mockConstructEvent.mockReturnValue({
      id: 'evt_1',
      type: 'checkout.session.completed',
      livemode: false,
      data: {
        object: {
          id: 'cs_test_123',
          status: 'complete',
          payment_status: 'paid',
          amount_total: PAYMENT_AMOUNT,
          currency: 'chf',
          metadata: { paymentId: PAYMENT_ID },
          payment_intent: PAYMENT_INTENT_ID,
          customer: STRIPE_CUSTOMER_ID,
        },
      },
    })

    const response = await POST(makeWebhookRequest())

    expect(response.status).toBe(200)
    expect(mockPaymentUpdate).toHaveBeenCalledWith({
      where: { id: PAYMENT_ID },
      data: expect.objectContaining({
        status: PaymentStatus.PAID,
        stripeCheckoutSessionId: 'cs_test_123',
        stripePaymentIntentId: PAYMENT_INTENT_ID,
        stripeChargeId: CHARGE_ID,
        stripeCustomerId: STRIPE_CUSTOMER_ID,
      }),
    })
    expect(mockRegistrationUpdate).toHaveBeenCalledWith({
      where: { id: REGISTRATION_ID },
      data: expect.objectContaining({
        status: RegistrationStatus.CONFIRMED,
        paymentStatus: PaymentStatus.PAID,
        expiresAt: null,
      }),
    })
    expect(mockWebhookCreate).toHaveBeenCalledOnce()
  })

  it('returns 400 when the Stripe signature header is missing', async () => {
    const response = await POST(makeWebhookRequest(''))

    expect(response.status).toBe(400)
    expect(mockConstructEvent).not.toHaveBeenCalled()
  })

  it('returns 400 when the Stripe signature is invalid', async () => {
    mockConstructEvent.mockImplementation(() => {
      throw new Error('invalid signature')
    })

    const response = await POST(makeWebhookRequest())

    expect(response.status).toBe(400)
  })

  it('rejects checkout completion when the Stripe amount does not match the payment record', async () => {
    mockConstructEvent.mockReturnValue({
      id: 'evt_amount_mismatch',
      type: 'checkout.session.completed',
      livemode: false,
      data: {
        object: {
          id: 'cs_amount_mismatch',
          status: 'complete',
          payment_status: 'paid',
          amount_total: 2500,
          currency: 'chf',
          metadata: { paymentId: PAYMENT_ID },
          payment_intent: PAYMENT_INTENT_ID,
        },
      },
    })

    const response = await POST(makeWebhookRequest())

    expect(response.status).toBe(200)
    expect(mockPaymentUpdate).not.toHaveBeenCalled()
    expect(mockRegistrationUpdate).not.toHaveBeenCalled()
  })

  it('rejects checkout completion when the Stripe session currency is missing', async () => {
    mockConstructEvent.mockReturnValue({
      id: 'evt_missing_currency',
      type: 'checkout.session.completed',
      livemode: false,
      data: {
        object: {
          id: 'cs_missing_currency',
          status: 'complete',
          payment_status: 'paid',
          amount_total: PAYMENT_AMOUNT,
          currency: null,
          metadata: { paymentId: PAYMENT_ID },
          payment_intent: PAYMENT_INTENT_ID,
        },
      },
    })

    const response = await POST(makeWebhookRequest())

    expect(response.status).toBe(200)
    expect(mockPaymentUpdate).not.toHaveBeenCalled()
  })

  it('skips checkout completion when paymentId metadata is missing', async () => {
    mockConstructEvent.mockReturnValue({
      id: 'evt_missing_payment_id',
      type: 'checkout.session.completed',
      livemode: false,
      data: {
        object: {
          id: 'cs_missing_payment_id',
          status: 'complete',
          payment_status: 'paid',
          amount_total: PAYMENT_AMOUNT,
          currency: 'chf',
          metadata: {},
        },
      },
    })

    const response = await POST(makeWebhookRequest())

    expect(response.status).toBe(200)
    expect(mockPaymentFindUnique).not.toHaveBeenCalled()
    expect(mockPaymentUpdate).not.toHaveBeenCalled()
  })

  it('skips checkout completion when the Stripe session is not fully paid and complete', async () => {
    mockConstructEvent.mockReturnValue({
      id: 'evt_unpaid_checkout',
      type: 'checkout.session.completed',
      livemode: false,
      data: {
        object: {
          id: 'cs_unpaid',
          status: 'open',
          payment_status: 'unpaid',
          amount_total: PAYMENT_AMOUNT,
          currency: 'chf',
          metadata: { paymentId: PAYMENT_ID },
        },
      },
    })

    const response = await POST(makeWebhookRequest())

    expect(response.status).toBe(200)
    expect(mockPaymentFindUnique).not.toHaveBeenCalled()
    expect(mockPaymentUpdate).not.toHaveBeenCalled()
  })

  it('skips checkout completion when the session is complete but payment_status is not paid', async () => {
    mockConstructEvent.mockReturnValue({
      id: 'evt_incomplete_payment',
      type: 'checkout.session.completed',
      livemode: false,
      data: {
        object: {
          id: 'cs_incomplete_payment',
          status: 'complete',
          payment_status: 'unpaid',
          amount_total: PAYMENT_AMOUNT,
          currency: 'chf',
          metadata: { paymentId: PAYMENT_ID },
        },
      },
    })

    const response = await POST(makeWebhookRequest())

    expect(response.status).toBe(200)
    expect(mockPaymentFindUnique).not.toHaveBeenCalled()
    expect(mockPaymentUpdate).not.toHaveBeenCalled()
  })

  it('rejects checkout completion when the Stripe currency does not match the payment record', async () => {
    mockConstructEvent.mockReturnValue({
      id: 'evt_currency_mismatch',
      type: 'checkout.session.completed',
      livemode: false,
      data: {
        object: {
          id: 'cs_test_currency',
          status: 'complete',
          payment_status: 'paid',
          amount_total: PAYMENT_AMOUNT,
          currency: 'eur',
          metadata: { paymentId: PAYMENT_ID },
          payment_intent: PAYMENT_INTENT_ID,
        },
      },
    })

    const response = await POST(makeWebhookRequest())

    expect(response.status).toBe(200)
    expect(mockPaymentUpdate).not.toHaveBeenCalled()
    expect(mockRegistrationUpdate).not.toHaveBeenCalled()
  })

  it('stores the expanded charge id and stripe fee when Stripe returns an expanded latest charge', async () => {
    mockPaymentIntentRetrieve.mockResolvedValue({
      latest_charge: {
        id: 'ch_expanded',
        balance_transaction: { fee: 321 },
      },
    })
    mockConstructEvent.mockReturnValue({
      id: 'evt_expanded_charge',
      type: 'checkout.session.completed',
      livemode: false,
      data: {
        object: {
          id: 'cs_expanded',
          status: 'complete',
          payment_status: 'paid',
          amount_total: PAYMENT_AMOUNT,
          currency: 'chf',
          metadata: { paymentId: PAYMENT_ID },
          payment_intent: PAYMENT_INTENT_ID,
          customer: STRIPE_CUSTOMER_ID,
        },
      },
    })

    const response = await POST(makeWebhookRequest())

    expect(response.status).toBe(200)
    expect(mockPaymentUpdate).toHaveBeenCalledWith({
      where: { id: PAYMENT_ID },
      data: expect.objectContaining({
        stripeChargeId: 'ch_expanded',
        stripeFee: 321,
      }),
    })
  })

  it('keeps stripeFee null when the expanded latest charge still exposes balance_transaction as a string', async () => {
    mockPaymentIntentRetrieve.mockResolvedValue({
      latest_charge: {
        id: 'ch_expanded_string_bt',
        balance_transaction: 'bt_456',
      },
    })
    mockConstructEvent.mockReturnValue({
      id: 'evt_expanded_string_bt',
      type: 'checkout.session.completed',
      livemode: false,
      data: {
        object: {
          id: 'cs_expanded_string_bt',
          status: 'complete',
          payment_status: 'paid',
          amount_total: PAYMENT_AMOUNT,
          currency: 'chf',
          metadata: { paymentId: PAYMENT_ID },
          payment_intent: PAYMENT_INTENT_ID,
          customer: STRIPE_CUSTOMER_ID,
        },
      },
    })

    const response = await POST(makeWebhookRequest())

    expect(response.status).toBe(200)
    expect(mockPaymentUpdate).toHaveBeenCalledWith({
      where: { id: PAYMENT_ID },
      data: expect.objectContaining({
        stripeChargeId: 'ch_expanded_string_bt',
        stripeFee: null,
      }),
    })
  })

  it('stores the expanded charge id even when the expanded latest charge has no usable balance transaction payload', async () => {
    mockPaymentIntentRetrieve.mockResolvedValue({
      latest_charge: {
        id: 'ch_expanded_without_bt',
        balance_transaction: null,
      },
    })
    mockConstructEvent.mockReturnValue({
      id: 'evt_expanded_without_bt',
      type: 'checkout.session.completed',
      livemode: false,
      data: {
        object: {
          id: 'cs_expanded_without_bt',
          status: 'complete',
          payment_status: 'paid',
          amount_total: PAYMENT_AMOUNT,
          currency: 'chf',
          metadata: { paymentId: PAYMENT_ID },
          payment_intent: PAYMENT_INTENT_ID,
          customer: STRIPE_CUSTOMER_ID,
        },
      },
    })

    const response = await POST(makeWebhookRequest())

    expect(response.status).toBe(200)
    expect(mockPaymentUpdate).toHaveBeenCalledWith({
      where: { id: PAYMENT_ID },
      data: expect.objectContaining({
        stripeChargeId: 'ch_expanded_without_bt',
        stripeFee: null,
      }),
    })
  })

  it('keeps both charge id and stripe fee null when Stripe returns no latest charge', async () => {
    mockPaymentIntentRetrieve.mockResolvedValue({ latest_charge: null })
    mockConstructEvent.mockReturnValue({
      id: 'evt_without_latest_charge',
      type: 'checkout.session.completed',
      livemode: false,
      data: {
        object: {
          id: 'cs_without_latest_charge',
          status: 'complete',
          payment_status: 'paid',
          amount_total: PAYMENT_AMOUNT,
          currency: 'chf',
          metadata: { paymentId: PAYMENT_ID },
          payment_intent: PAYMENT_INTENT_ID,
          customer: STRIPE_CUSTOMER_ID,
        },
      },
    })

    const response = await POST(makeWebhookRequest())

    expect(response.status).toBe(200)
    expect(mockPaymentUpdate).toHaveBeenCalledWith({
      where: { id: PAYMENT_ID },
      data: expect.objectContaining({
        stripeChargeId: null,
        stripeFee: null,
      }),
    })
  })

  it('still confirms checkout completion when Stripe payment intent retrieval fails', async () => {
    mockPaymentIntentRetrieve.mockRejectedValue(new Error('stripe unavailable'))
    mockConstructEvent.mockReturnValue({
      id: 'evt_payment_intent_failure',
      type: 'checkout.session.completed',
      livemode: false,
      data: {
        object: {
          id: 'cs_retrieve_failure',
          status: 'complete',
          payment_status: 'paid',
          amount_total: PAYMENT_AMOUNT,
          currency: 'chf',
          metadata: { paymentId: PAYMENT_ID },
          payment_intent: PAYMENT_INTENT_ID,
          customer: STRIPE_CUSTOMER_ID,
        },
      },
    })

    const response = await POST(makeWebhookRequest())

    expect(response.status).toBe(200)
    expect(mockPaymentUpdate).toHaveBeenCalledWith({
      where: { id: PAYMENT_ID },
      data: expect.objectContaining({
        stripePaymentIntentId: PAYMENT_INTENT_ID,
        stripeChargeId: null,
        stripeFee: null,
      }),
    })
  })

  it('ignores a late checkout completion for a cancelled payment attempt', async () => {
    mockConstructEvent.mockReturnValue({
      id: 'evt_late_success',
      type: 'checkout.session.completed',
      livemode: false,
      data: {
        object: {
          id: 'cs_test_late',
          status: 'complete',
          payment_status: 'paid',
          amount_total: PAYMENT_AMOUNT,
          currency: 'chf',
          metadata: { paymentId: PAYMENT_ID },
          payment_intent: PAYMENT_INTENT_ID,
        },
      },
    })

    mockPaymentFindUnique.mockResolvedValue({
      id: PAYMENT_ID,
      status: PaymentStatus.CANCELLED,
      amount: PAYMENT_AMOUNT,
      currency: 'CHF',
      registration: {
        id: REGISTRATION_ID,
        status: RegistrationStatus.EXPIRED,
        paymentStatus: PaymentStatus.CANCELLED,
      },
    })

    const response = await POST(makeWebhookRequest())

    expect(response.status).toBe(200)
    expect(mockPaymentUpdate).not.toHaveBeenCalled()
    expect(mockRegistrationUpdate).not.toHaveBeenCalled()
  })

  it('skips checkout completion when the payment record cannot be found', async () => {
    mockConstructEvent.mockReturnValue({
      id: 'evt_missing_payment',
      type: 'checkout.session.completed',
      livemode: false,
      data: {
        object: {
          id: 'cs_missing_payment',
          status: 'complete',
          payment_status: 'paid',
          amount_total: PAYMENT_AMOUNT,
          currency: 'chf',
          metadata: { paymentId: PAYMENT_ID },
          payment_intent: PAYMENT_INTENT_ID,
        },
      },
    })
    mockPaymentFindUnique.mockResolvedValue(null)

    const response = await POST(makeWebhookRequest())

    expect(response.status).toBe(200)
    expect(mockPaymentUpdate).not.toHaveBeenCalled()
    expect(mockRegistrationUpdate).not.toHaveBeenCalled()
  })

  it('skips checkout completion when the registration status is no longer pending', async () => {
    mockConstructEvent.mockReturnValue({
      id: 'evt_non_pending_registration',
      type: 'checkout.session.completed',
      livemode: false,
      data: {
        object: {
          id: 'cs_non_pending_registration',
          status: 'complete',
          payment_status: 'paid',
          amount_total: PAYMENT_AMOUNT,
          currency: 'chf',
          metadata: { paymentId: PAYMENT_ID },
          payment_intent: PAYMENT_INTENT_ID,
        },
      },
    })
    mockPaymentFindUnique.mockResolvedValue({
      id: PAYMENT_ID,
      status: PaymentStatus.PENDING,
      amount: PAYMENT_AMOUNT,
      currency: 'CHF',
      registration: {
        id: REGISTRATION_ID,
        status: RegistrationStatus.CONFIRMED,
        paymentStatus: PaymentStatus.PENDING,
      },
    })

    const response = await POST(makeWebhookRequest())

    expect(response.status).toBe(200)
    expect(mockPaymentUpdate).not.toHaveBeenCalled()
    expect(mockRegistrationUpdate).not.toHaveBeenCalled()
  })

  it('skips checkout completion when the registration payment status is no longer pending', async () => {
    mockConstructEvent.mockReturnValue({
      id: 'evt_non_pending_payment_status',
      type: 'checkout.session.completed',
      livemode: false,
      data: {
        object: {
          id: 'cs_non_pending_payment_status',
          status: 'complete',
          payment_status: 'paid',
          amount_total: PAYMENT_AMOUNT,
          currency: 'chf',
          metadata: { paymentId: PAYMENT_ID },
          payment_intent: PAYMENT_INTENT_ID,
        },
      },
    })
    mockPaymentFindUnique.mockResolvedValue({
      id: PAYMENT_ID,
      status: PaymentStatus.PENDING,
      amount: PAYMENT_AMOUNT,
      currency: 'CHF',
      registration: {
        id: REGISTRATION_ID,
        status: RegistrationStatus.PENDING,
        paymentStatus: PaymentStatus.CANCELLED,
      },
    })

    const response = await POST(makeWebhookRequest())

    expect(response.status).toBe(200)
    expect(mockPaymentUpdate).not.toHaveBeenCalled()
    expect(mockRegistrationUpdate).not.toHaveBeenCalled()
  })

  it('confirms checkout completion without a payment intent id and with a non-string customer', async () => {
    mockConstructEvent.mockReturnValue({
      id: 'evt_no_payment_intent',
      type: 'checkout.session.completed',
      livemode: false,
      data: {
        object: {
          id: 'cs_no_payment_intent',
          status: 'complete',
          payment_status: 'paid',
          amount_total: PAYMENT_AMOUNT,
          currency: 'chf',
          metadata: { paymentId: PAYMENT_ID },
          payment_intent: null,
          customer: { id: STRIPE_CUSTOMER_ID },
        },
      },
    })

    const response = await POST(makeWebhookRequest())

    expect(response.status).toBe(200)
    expect(mockPaymentIntentRetrieve).not.toHaveBeenCalled()
    expect(mockPaymentUpdate).toHaveBeenCalledWith({
      where: { id: PAYMENT_ID },
      data: expect.objectContaining({
        stripePaymentIntentId: null,
        stripeChargeId: null,
        stripeCustomerId: null,
      }),
    })
  })

  it('ignores duplicate events', async () => {
    const duplicateError = new Prisma.PrismaClientKnownRequestError(
      'Unique constraint failed',
      { code: 'P2002', clientVersion: '0.0.0' },
    )
    mockWebhookCreate.mockRejectedValue(duplicateError)
    mockConstructEvent.mockReturnValue({
      id: 'evt_duplicate',
      type: 'checkout.session.completed',
      livemode: false,
      data: { object: {} },
    })

    const response = await POST(makeWebhookRequest())

    expect(response.status).toBe(200)
    expect(mockPaymentUpdate).not.toHaveBeenCalled()
    expect(mockWebhookCreate).toHaveBeenCalledOnce()
  })

  it('returns 500 when the webhook idempotency record cannot be inserted for a non-duplicate error', async () => {
    mockWebhookCreate.mockRejectedValue(new Error('insert failed'))
    mockConstructEvent.mockReturnValue({
      id: 'evt_idempotency_failure',
      type: 'checkout.session.completed',
      livemode: false,
      data: { object: {} },
    })

    const response = await POST(makeWebhookRequest())

    expect(response.status).toBe(500)
  })

  it('rejects events whose livemode does not match the runtime environment', async () => {
    mockConstructEvent.mockReturnValue({
      id: 'evt_livemode_mismatch',
      type: 'checkout.session.completed',
      livemode: true,
      data: { object: {} },
    })

    const response = await POST(makeWebhookRequest())

    expect(response.status).toBe(400)
    expect(mockWebhookCreate).not.toHaveBeenCalled()
  })

  it('cancels registration on checkout expiration', async () => {
    mockConstructEvent.mockReturnValue({
      id: 'evt_expired',
      type: 'checkout.session.expired',
      livemode: false,
      data: {
        object: {
          id: 'cs_expired',
          metadata: { paymentId: PAYMENT_ID },
        },
      },
    })

    mockPaymentFindFirst.mockResolvedValue({
      id: PAYMENT_ID,
      status: PaymentStatus.PENDING,
      registration: {
        id: REGISTRATION_ID,
        userId: USER_ID,
        tournamentId: TOURNAMENT_ID,
        status: RegistrationStatus.PENDING,
      },
    })

    const response = await POST(makeWebhookRequest())

    expect(response.status).toBe(200)
    expect(mockRemoveUserFromTeam).toHaveBeenCalled()
    expect(mockPaymentUpdate).toHaveBeenCalledWith({
      where: { id: PAYMENT_ID },
      data: expect.objectContaining({
        status: PaymentStatus.CANCELLED,
        stripeCheckoutSessionId: 'cs_expired',
      }),
    })
    expect(mockRegistrationUpdate).toHaveBeenCalledWith({
      where: { id: REGISTRATION_ID },
      data: expect.objectContaining({
        status: RegistrationStatus.EXPIRED,
        paymentStatus: PaymentStatus.CANCELLED,
        teamId: null,
      }),
    })
  })

  it('skips checkout.expired when no payment is found or the payment is already terminal', async () => {
    mockConstructEvent.mockReturnValueOnce({
      id: 'evt_expired_missing',
      type: 'checkout.session.expired',
      livemode: false,
      data: {
        object: {
          id: 'cs_expired_missing',
          metadata: { paymentId: 'pay-missing' },
        },
      },
    })
    mockPaymentFindFirst.mockResolvedValueOnce(null)

    let response = await POST(makeWebhookRequest())

    expect(response.status).toBe(200)
    expect(mockPaymentUpdate).not.toHaveBeenCalled()

    mockConstructEvent.mockReturnValueOnce({
      id: 'evt_expired_paid',
      type: 'checkout.session.expired',
      livemode: false,
      data: {
        object: {
          id: 'cs_expired_paid',
          metadata: { paymentId: 'pay-2' },
        },
      },
    })
    mockPaymentFindFirst.mockResolvedValueOnce({
      id: 'pay-2',
      status: PaymentStatus.PAID,
      registration: {
        id: 'reg-2',
        userId: 'user-2',
        tournamentId: TOURNAMENT_ID,
      },
    })

    response = await POST(makeWebhookRequest())

    expect(response.status).toBe(200)
    expect(mockPaymentUpdate).not.toHaveBeenCalled()
  })

  it('matches checkout.expired by session id when metadata does not include a paymentId', async () => {
    mockConstructEvent.mockReturnValue({
      id: 'evt_expired_without_metadata',
      type: 'checkout.session.expired',
      livemode: false,
      data: {
        object: {
          id: 'cs_expired_no_metadata',
          metadata: {},
        },
      },
    })
    mockPaymentFindFirst.mockResolvedValue({
      id: PAYMENT_ID,
      status: PaymentStatus.PENDING,
      registration: {
        id: REGISTRATION_ID,
        userId: USER_ID,
        tournamentId: TOURNAMENT_ID,
        status: RegistrationStatus.PENDING,
      },
    })

    const response = await POST(makeWebhookRequest())

    expect(response.status).toBe(200)
    expect(mockPaymentFindFirst).toHaveBeenCalledWith({
      where: {
        OR: [{ stripeCheckoutSessionId: 'cs_expired_no_metadata' }],
      },
      include: {
        registration: {
          select: {
            id: true,
            userId: true,
            tournamentId: true,
            status: true,
          },
        },
      },
    })
  })

  it('marks registration as expired on payment failure', async () => {
    mockConstructEvent.mockReturnValue({
      id: 'evt_failed',
      type: 'payment_intent.payment_failed',
      livemode: false,
      data: {
        object: {
          id: 'pi_failed',
          metadata: { paymentId: PAYMENT_ID },
        },
      },
    })

    mockPaymentFindUnique.mockResolvedValue({
      id: PAYMENT_ID,
      status: PaymentStatus.PENDING,
      registration: {
        id: REGISTRATION_ID,
        userId: USER_ID,
        tournamentId: TOURNAMENT_ID,
      },
    })

    const response = await POST(makeWebhookRequest())

    expect(response.status).toBe(200)
    expect(mockRemoveUserFromTeam).toHaveBeenCalled()
    expect(mockPaymentUpdate).toHaveBeenCalledWith({
      where: { id: PAYMENT_ID },
      data: expect.objectContaining({
        status: PaymentStatus.FAILED,
        stripePaymentIntentId: 'pi_failed',
      }),
    })
    expect(mockRegistrationUpdate).toHaveBeenCalledWith({
      where: { id: REGISTRATION_ID },
      data: expect.objectContaining({
        status: RegistrationStatus.EXPIRED,
        paymentStatus: PaymentStatus.FAILED,
        teamId: null,
      }),
    })
  })

  it('skips payment_failed when no paymentId in metadata', async () => {
    mockConstructEvent.mockReturnValue({
      id: 'evt_failed_2',
      type: 'payment_intent.payment_failed',
      livemode: false,
      data: {
        object: {
          id: 'pi_no_meta',
          metadata: {},
        },
      },
    })

    const response = await POST(makeWebhookRequest())

    expect(response.status).toBe(200)
    expect(mockPaymentUpdate).not.toHaveBeenCalled()
  })

  it('skips payment_failed processing when the payment is missing', async () => {
    mockConstructEvent.mockReturnValue({
      id: 'evt_failed_missing_payment',
      type: 'payment_intent.payment_failed',
      livemode: false,
      data: {
        object: {
          id: 'pi_missing',
          metadata: { paymentId: 'pay-missing' },
        },
      },
    })
    mockPaymentFindUnique.mockResolvedValue(null)

    const response = await POST(makeWebhookRequest())

    expect(response.status).toBe(200)
    expect(mockPaymentUpdate).not.toHaveBeenCalled()
    expect(mockRegistrationUpdate).not.toHaveBeenCalled()
  })

  it('marks registration as refunded on a full charge.refunded event', async () => {
    mockConstructEvent.mockReturnValue({
      id: 'evt_refund',
      type: 'charge.refunded',
      livemode: false,
      data: {
        object: {
          id: 'ch_refund_1',
          amount: PAYMENT_AMOUNT,
          amount_refunded: PAYMENT_AMOUNT,
        },
      },
    })

    mockPaymentFindFirst.mockResolvedValue({
      id: PAYMENT_ID,
      status: PaymentStatus.PAID,
      registration: {
        id: REGISTRATION_ID,
        userId: USER_ID,
        tournamentId: TOURNAMENT_ID,
      },
    })

    const response = await POST(makeWebhookRequest())

    expect(response.status).toBe(200)
    expect(mockPaymentUpdate).toHaveBeenCalledWith({
      where: { id: PAYMENT_ID },
      data: expect.objectContaining({
        status: PaymentStatus.REFUNDED,
        refundAmount: PAYMENT_AMOUNT,
      }),
    })
    expect(mockRemoveUserFromTeam).toHaveBeenCalledWith(
      expect.anything(),
      USER_ID,
      TOURNAMENT_ID,
    )
    expect(mockRegistrationUpdate).toHaveBeenCalledWith({
      where: { id: REGISTRATION_ID },
      data: expect.objectContaining({
        status: RegistrationStatus.CANCELLED,
        paymentStatus: PaymentStatus.REFUNDED,
        teamId: null,
      }),
    })
  })

  it('updates only the payment on a partial charge.refunded event', async () => {
    mockConstructEvent.mockReturnValue({
      id: 'evt_partial_refund',
      type: 'charge.refunded',
      livemode: false,
      data: {
        object: {
          id: 'ch_partial',
          amount: PAYMENT_AMOUNT,
          amount_refunded: 500,
        },
      },
    })

    mockPaymentFindFirst.mockResolvedValue({
      id: PAYMENT_ID,
      status: PaymentStatus.PAID,
      registration: {
        id: REGISTRATION_ID,
        userId: USER_ID,
        tournamentId: TOURNAMENT_ID,
      },
    })

    const response = await POST(makeWebhookRequest())

    expect(response.status).toBe(200)
    expect(mockPaymentUpdate).toHaveBeenCalledWith({
      where: { id: PAYMENT_ID },
      data: expect.objectContaining({
        status: PaymentStatus.PAID,
        refundAmount: 500,
      }),
    })
    expect(mockRemoveUserFromTeam).not.toHaveBeenCalled()
    expect(mockRegistrationUpdate).not.toHaveBeenCalled()
  })

  it('falls back to stripePaymentIntentId when a refunded charge has no stripeChargeId match', async () => {
    mockConstructEvent.mockReturnValue({
      id: 'evt_refund_fallback',
      type: 'charge.refunded',
      livemode: false,
      data: {
        object: {
          id: 'ch_unknown',
          payment_intent: 'pi_refund',
          amount: PAYMENT_AMOUNT,
          amount_refunded: PAYMENT_AMOUNT,
        },
      },
    })
    mockPaymentFindFirst.mockResolvedValueOnce(null).mockResolvedValueOnce({
      id: PAYMENT_ID,
      status: PaymentStatus.PAID,
      registration: {
        id: REGISTRATION_ID,
        userId: USER_ID,
        tournamentId: TOURNAMENT_ID,
      },
    })

    const response = await POST(makeWebhookRequest())

    expect(response.status).toBe(200)
    expect(mockPaymentFindFirst).toHaveBeenNthCalledWith(1, {
      where: { stripeChargeId: 'ch_unknown' },
      include: {
        registration: {
          select: { id: true, userId: true, tournamentId: true },
        },
      },
    })
    expect(mockPaymentFindFirst).toHaveBeenNthCalledWith(2, {
      where: { stripePaymentIntentId: 'pi_refund' },
      include: {
        registration: {
          select: { id: true, userId: true, tournamentId: true },
        },
      },
    })
  })

  it('skips charge.refunded when no matching payment found', async () => {
    mockConstructEvent.mockReturnValue({
      id: 'evt_refund_2',
      type: 'charge.refunded',
      livemode: false,
      data: {
        object: {
          id: 'ch_unknown',
          amount_refunded: 500,
        },
      },
    })

    mockPaymentFindFirst.mockResolvedValue(null)

    const response = await POST(makeWebhookRequest())

    expect(response.status).toBe(200)
    expect(mockPaymentUpdate).not.toHaveBeenCalled()
  })

  it('backfills the stripe fee from a charge.updated event with a balance transaction id', async () => {
    mockConstructEvent.mockReturnValue({
      id: 'evt_charge_updated',
      type: 'charge.updated',
      livemode: false,
      data: {
        object: {
          id: CHARGE_ID,
          balance_transaction: 'bt_123',
        },
      },
    })
    mockPaymentFindFirst.mockResolvedValue({ id: PAYMENT_ID, stripeFee: null })

    const response = await POST(makeWebhookRequest())

    expect(response.status).toBe(200)
    expect(mockBalanceTransactionRetrieve).toHaveBeenCalledWith('bt_123')
    expect(mockPaymentUpdate).toHaveBeenCalledWith({
      where: { id: PAYMENT_ID },
      data: { stripeFee: STRIPE_FEE_AMOUNT },
    })
  })

  it('uses the expanded balance transaction fee on charge.updated without a Stripe API call', async () => {
    mockConstructEvent.mockReturnValue({
      id: 'evt_charge_updated_expanded',
      type: 'charge.updated',
      livemode: false,
      data: {
        object: {
          id: CHARGE_ID,
          balance_transaction: { fee: 456 },
        },
      },
    })
    mockPaymentFindFirst.mockResolvedValue({ id: PAYMENT_ID, stripeFee: null })

    const response = await POST(makeWebhookRequest())

    expect(response.status).toBe(200)
    expect(mockBalanceTransactionRetrieve).not.toHaveBeenCalled()
    expect(mockPaymentUpdate).toHaveBeenCalledWith({
      where: { id: PAYMENT_ID },
      data: { stripeFee: 456 },
    })
  })

  it('skips charge.updated when there is no balance transaction, no payment, or the fee is already stored', async () => {
    mockConstructEvent.mockReturnValueOnce({
      id: 'evt_charge_updated_no_bt',
      type: 'charge.updated',
      livemode: false,
      data: {
        object: {
          id: 'ch_no_bt',
          balance_transaction: null,
        },
      },
    })

    let response = await POST(makeWebhookRequest())

    expect(response.status).toBe(200)
    expect(mockPaymentFindFirst).not.toHaveBeenCalled()

    mockConstructEvent.mockReturnValueOnce({
      id: 'evt_charge_updated_missing_payment',
      type: 'charge.updated',
      livemode: false,
      data: {
        object: {
          id: 'ch_missing_payment',
          balance_transaction: 'bt_123',
        },
      },
    })
    mockPaymentFindFirst.mockResolvedValueOnce(null)

    response = await POST(makeWebhookRequest())

    expect(response.status).toBe(200)
    expect(mockPaymentUpdate).not.toHaveBeenCalled()

    mockConstructEvent.mockReturnValueOnce({
      id: 'evt_charge_updated_existing_fee',
      type: 'charge.updated',
      livemode: false,
      data: {
        object: {
          id: 'ch_existing_fee',
          balance_transaction: 'bt_123',
        },
      },
    })
    mockPaymentFindFirst.mockResolvedValueOnce({
      id: PAYMENT_ID,
      stripeFee: 999,
    })

    response = await POST(makeWebhookRequest())

    expect(response.status).toBe(200)
    expect(mockBalanceTransactionRetrieve).not.toHaveBeenCalled()
  })

  it('releases the idempotency row and returns 500 when a handler throws', async () => {
    mockConstructEvent.mockReturnValue({
      id: 'evt_charge_update_failure',
      type: 'charge.updated',
      livemode: false,
      data: {
        object: {
          id: CHARGE_ID,
          balance_transaction: 'bt_123',
        },
      },
    })
    mockPaymentFindFirst.mockResolvedValue({ id: PAYMENT_ID, stripeFee: null })
    mockPaymentUpdate.mockRejectedValue(new Error('update failed'))

    const response = await POST(makeWebhookRequest())

    expect(response.status).toBe(500)
    expect(mockWebhookDelete).toHaveBeenCalledWith({
      where: { stripeEventId: 'evt_charge_update_failure' },
    })
  })

  it('returns 200 even when cache revalidation fails after successful processing', async () => {
    mockRevalidateTag.mockImplementation(() => {
      throw new Error('cache failure')
    })
    mockConstructEvent.mockReturnValue({
      id: 'evt_cache_failure',
      type: 'payment_intent.payment_failed',
      livemode: false,
      data: {
        object: {
          id: 'pi_no_meta',
          metadata: {},
        },
      },
    })

    const response = await POST(makeWebhookRequest())

    expect(response.status).toBe(200)
    expect(mockLoggerWarn).toHaveBeenCalledWith(
      {
        error: expect.any(Error),
        eventId: 'evt_cache_failure',
        type: 'payment_intent.payment_failed',
      },
      'Stripe webhook cache revalidation failed',
    )
  })

  it('accepts unhandled Stripe event types without processing mutations', async () => {
    mockConstructEvent.mockReturnValue({
      id: 'evt_unhandled',
      type: 'customer.created',
      livemode: false,
      data: { object: {} },
    })

    const response = await POST(makeWebhookRequest())

    expect(response.status).toBe(200)
    expect(mockPaymentUpdate).not.toHaveBeenCalled()
    expect(mockRegistrationUpdate).not.toHaveBeenCalled()
  })
})
