/**
 * File: tests/api/webhook.test.ts
 * Description: Unit tests for the Stripe webhook API route.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'
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
    mockWebhookFindUnique.mockResolvedValue({ id: 'stored-event' })
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
    expect(mockWebhookCreate).not.toHaveBeenCalled()
  })
})
