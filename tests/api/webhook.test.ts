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

vi.mock('next/cache', () => ({
  revalidateTag: vi.fn(),
}))

vi.mock('@/lib/core/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))

const mockRemoveUserFromTeam = vi.fn()
vi.mock('@/lib/utils/team', () => ({
  removeUserFromTeam: (...args: unknown[]) => mockRemoveUserFromTeam(...args),
}))

const mockConstructEvent = vi.fn()
const mockPaymentIntentRetrieve = vi.fn()
vi.mock('@/lib/core/stripe', () => ({
  getStripe: () => ({
    webhooks: {
      constructEvent: (...args: unknown[]) => mockConstructEvent(...args),
    },
    paymentIntents: {
      retrieve: (...args: unknown[]) => mockPaymentIntentRetrieve(...args),
    },
  }),
  getStripeWebhookSecret: () => 'whsec_test',
}))

const mockWebhookFindUnique = vi.fn()
const mockWebhookCreate = vi.fn()
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

describe('POST /api/webhook', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    mockWebhookFindUnique.mockResolvedValue(null)
    mockWebhookCreate.mockResolvedValue({ id: 'stored-event' })
    mockPaymentIntentRetrieve.mockResolvedValue({ latest_charge: 'ch_123' })
    mockPaymentFindUnique.mockResolvedValue({
      id: 'pay-1',
      status: PaymentStatus.PENDING,
      registration: { id: 'reg-1' },
    })

    mockTransaction.mockImplementation(async callback =>
      callback({
        payment: { update: mockPaymentUpdate },
        tournamentRegistration: { update: mockRegistrationUpdate },
      }),
    )
  })

  it('confirms a pending registration on checkout completion', async () => {
    mockConstructEvent.mockReturnValue({
      id: 'evt_1',
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_test_123',
          metadata: { paymentId: 'pay-1' },
          payment_intent: 'pi_123',
          customer: 'cus_123',
        },
      },
    })

    const response = await POST(
      new Request('http://localhost:3000/api/webhook', {
        method: 'POST',
        headers: { 'stripe-signature': 'sig_test' },
        body: JSON.stringify({}),
      }),
    )

    expect(response.status).toBe(200)
    expect(mockPaymentUpdate).toHaveBeenCalledWith({
      where: { id: 'pay-1' },
      data: expect.objectContaining({
        status: PaymentStatus.PAID,
        stripeCheckoutSessionId: 'cs_test_123',
        stripePaymentIntentId: 'pi_123',
        stripeChargeId: 'ch_123',
        stripeCustomerId: 'cus_123',
      }),
    })
    expect(mockRegistrationUpdate).toHaveBeenCalledWith({
      where: { id: 'reg-1' },
      data: expect.objectContaining({
        status: RegistrationStatus.CONFIRMED,
        paymentStatus: PaymentStatus.PAID,
        expiresAt: null,
      }),
    })
    expect(mockWebhookCreate).toHaveBeenCalledOnce()
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
      data: { object: {} },
    })

    const response = await POST(
      new Request('http://localhost:3000/api/webhook', {
        method: 'POST',
        headers: { 'stripe-signature': 'sig_test' },
        body: JSON.stringify({}),
      }),
    )

    expect(response.status).toBe(200)
    expect(mockPaymentUpdate).not.toHaveBeenCalled()
    expect(mockWebhookCreate).toHaveBeenCalledOnce()
  })

  // -------------------------------------------------------------------------
  // checkout.session.expired
  // -------------------------------------------------------------------------

  it('cancels registration on checkout expiration', async () => {
    mockConstructEvent.mockReturnValue({
      id: 'evt_expired',
      type: 'checkout.session.expired',
      data: {
        object: {
          id: 'cs_expired',
          metadata: { paymentId: 'pay-1' },
        },
      },
    })

    mockPaymentFindFirst.mockResolvedValue({
      id: 'pay-1',
      status: PaymentStatus.PENDING,
      registration: {
        id: 'reg-1',
        userId: 'user-1',
        tournamentId: 'tourn-1',
        status: RegistrationStatus.PENDING,
      },
    })

    const response = await POST(
      new Request('http://localhost:3000/api/webhook', {
        method: 'POST',
        headers: { 'stripe-signature': 'sig_test' },
        body: JSON.stringify({}),
      }),
    )

    expect(response.status).toBe(200)
    expect(mockRemoveUserFromTeam).toHaveBeenCalled()
    expect(mockPaymentUpdate).toHaveBeenCalledWith({
      where: { id: 'pay-1' },
      data: expect.objectContaining({
        status: PaymentStatus.CANCELLED,
        stripeCheckoutSessionId: 'cs_expired',
      }),
    })
    expect(mockRegistrationUpdate).toHaveBeenCalledWith({
      where: { id: 'reg-1' },
      data: expect.objectContaining({
        status: RegistrationStatus.EXPIRED,
        paymentStatus: PaymentStatus.CANCELLED,
        teamId: null,
      }),
    })
    expect(mockWebhookCreate).toHaveBeenCalledOnce()
  })

  it('skips checkout.expired when payment is already PAID', async () => {
    mockConstructEvent.mockReturnValue({
      id: 'evt_expired_2',
      type: 'checkout.session.expired',
      data: {
        object: {
          id: 'cs_expired_2',
          metadata: { paymentId: 'pay-2' },
        },
      },
    })

    mockPaymentFindFirst.mockResolvedValue({
      id: 'pay-2',
      status: PaymentStatus.PAID,
      registration: { id: 'reg-2', userId: 'user-2', tournamentId: 'tourn-1' },
    })

    const response = await POST(
      new Request('http://localhost:3000/api/webhook', {
        method: 'POST',
        headers: { 'stripe-signature': 'sig_test' },
        body: JSON.stringify({}),
      }),
    )

    expect(response.status).toBe(200)
    expect(mockPaymentUpdate).not.toHaveBeenCalled()
  })

  // -------------------------------------------------------------------------
  // payment_intent.payment_failed
  // -------------------------------------------------------------------------

  it('marks registration as expired on payment failure', async () => {
    mockConstructEvent.mockReturnValue({
      id: 'evt_failed',
      type: 'payment_intent.payment_failed',
      data: {
        object: {
          id: 'pi_failed',
          metadata: { paymentId: 'pay-1' },
        },
      },
    })

    mockPaymentFindUnique.mockResolvedValue({
      id: 'pay-1',
      status: PaymentStatus.PENDING,
      registration: {
        id: 'reg-1',
        userId: 'user-1',
        tournamentId: 'tourn-1',
      },
    })

    const response = await POST(
      new Request('http://localhost:3000/api/webhook', {
        method: 'POST',
        headers: { 'stripe-signature': 'sig_test' },
        body: JSON.stringify({}),
      }),
    )

    expect(response.status).toBe(200)
    expect(mockRemoveUserFromTeam).toHaveBeenCalled()
    expect(mockPaymentUpdate).toHaveBeenCalledWith({
      where: { id: 'pay-1' },
      data: expect.objectContaining({
        status: PaymentStatus.FAILED,
        stripePaymentIntentId: 'pi_failed',
      }),
    })
    expect(mockRegistrationUpdate).toHaveBeenCalledWith({
      where: { id: 'reg-1' },
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
      data: {
        object: {
          id: 'pi_no_meta',
          metadata: {},
        },
      },
    })

    const response = await POST(
      new Request('http://localhost:3000/api/webhook', {
        method: 'POST',
        headers: { 'stripe-signature': 'sig_test' },
        body: JSON.stringify({}),
      }),
    )

    expect(response.status).toBe(200)
    expect(mockPaymentUpdate).not.toHaveBeenCalled()
  })

  // -------------------------------------------------------------------------
  // charge.refunded
  // -------------------------------------------------------------------------

  it('marks registration as refunded on charge.refunded', async () => {
    mockConstructEvent.mockReturnValue({
      id: 'evt_refund',
      type: 'charge.refunded',
      data: {
        object: {
          id: 'ch_refund_1',
          amount: 1500,
          amount_refunded: 1500,
        },
      },
    })

    mockPaymentFindFirst.mockResolvedValue({
      id: 'pay-1',
      registration: { id: 'reg-1' },
    })

    const response = await POST(
      new Request('http://localhost:3000/api/webhook', {
        method: 'POST',
        headers: { 'stripe-signature': 'sig_test' },
        body: JSON.stringify({}),
      }),
    )

    expect(response.status).toBe(200)
    expect(mockPaymentUpdate).toHaveBeenCalledWith({
      where: { id: 'pay-1' },
      data: expect.objectContaining({
        status: PaymentStatus.REFUNDED,
        refundAmount: 1500,
      }),
    })
    expect(mockRegistrationUpdate).toHaveBeenCalledWith({
      where: { id: 'reg-1' },
      data: expect.objectContaining({
        status: RegistrationStatus.CANCELLED,
        paymentStatus: PaymentStatus.REFUNDED,
      }),
    })
  })

  it('skips charge.refunded when no matching payment found', async () => {
    mockConstructEvent.mockReturnValue({
      id: 'evt_refund_2',
      type: 'charge.refunded',
      data: {
        object: {
          id: 'ch_unknown',
          amount_refunded: 500,
        },
      },
    })

    mockPaymentFindFirst.mockResolvedValue(null)

    const response = await POST(
      new Request('http://localhost:3000/api/webhook', {
        method: 'POST',
        headers: { 'stripe-signature': 'sig_test' },
        body: JSON.stringify({}),
      }),
    )

    expect(response.status).toBe(200)
    expect(mockPaymentUpdate).not.toHaveBeenCalled()
  })
})
