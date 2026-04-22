/**
 * File: tests/utils/stripe-refund.test.ts
 * Description: Unit tests for the Stripe refund helpers (computeRefundAmount and issueStripeRefundAfterDbUpdate).
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

vi.mock('@/lib/core/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}))

const mockRefundCreate = vi.fn()
vi.mock('@/lib/core/stripe', () => ({
  getStripe: () => ({
    refunds: { create: (...args: unknown[]) => mockRefundCreate(...args) },
  }),
}))

const mockRegistrationUpdate = vi.fn()
const mockPaymentUpdate = vi.fn()
const mockTransaction = vi.fn()

vi.mock('@/lib/core/prisma', () => ({
  default: {
    tournamentRegistration: {
      update: (...args: unknown[]) => mockRegistrationUpdate(...args),
    },
    payment: { update: (...args: unknown[]) => mockPaymentUpdate(...args) },
    $transaction: (...args: unknown[]) => mockTransaction(...args),
  },
}))

const { computeRefundAmount, issueStripeRefundAfterDbUpdate } = await import(
  '@/lib/utils/stripe-refund'
)

// ---------------------------------------------------------------------------
// computeRefundAmount
// ---------------------------------------------------------------------------

describe('computeRefundAmount', () => {
  it('deducts the Stripe fee when known', () => {
    expect(computeRefundAmount(5000, 150)).toBe(4850)
  })

  it('returns the full amount when the Stripe fee is null', () => {
    expect(computeRefundAmount(5000, null)).toBe(5000)
  })

  it('returns 0 when the fee equals the full amount', () => {
    expect(computeRefundAmount(100, 100)).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// issueStripeRefundAfterDbUpdate
// ---------------------------------------------------------------------------

const PAYMENT = {
  id: 'pay-1',
  amount: 5000,
  stripeFee: 150,
  donationAmount: null,
  stripePaymentIntentId: 'pi_123',
  stripeChargeId: null,
}

describe('issueStripeRefundAfterDbUpdate', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRefundCreate.mockResolvedValue({ id: 're_123' })
    mockTransaction.mockImplementation(
      async (cb: (tx: unknown) => Promise<void>) =>
        cb({
          tournamentRegistration: { update: mockRegistrationUpdate },
          payment: { update: mockPaymentUpdate },
        }),
    )
  })

  it('calls stripe.refunds.create with payment_intent and deducted amount', async () => {
    await issueStripeRefundAfterDbUpdate({
      registrationId: 'reg-1',
      latestPayment: PAYMENT,
      previousPaymentStatus: PaymentStatus.PAID,
      idempotencyPrefix: 'refund',
    })

    expect(mockRefundCreate).toHaveBeenCalledWith(
      {
        payment_intent: 'pi_123',
        amount: 4850,
        reason: 'requested_by_customer',
      },
      { idempotencyKey: 'refund-reg-1-pay-1' },
    )
  })

  it('falls back to charge ID when payment_intent is null', async () => {
    await issueStripeRefundAfterDbUpdate({
      registrationId: 'reg-1',
      latestPayment: {
        ...PAYMENT,
        stripePaymentIntentId: null,
        stripeChargeId: 'ch_abc',
      },
      previousPaymentStatus: PaymentStatus.PAID,
      idempotencyPrefix: 'refund',
    })

    expect(mockRefundCreate).toHaveBeenCalledWith(
      expect.objectContaining({ charge: 'ch_abc' }),
      expect.any(Object),
    )
  })

  it('reverts DB records and rethrows when Stripe call fails', async () => {
    const stripeError = new Error('Stripe unavailable')
    mockRefundCreate.mockRejectedValue(stripeError)

    await expect(
      issueStripeRefundAfterDbUpdate({
        registrationId: 'reg-1',
        latestPayment: PAYMENT,
        previousPaymentStatus: PaymentStatus.PAID,
        idempotencyPrefix: 'refund',
      }),
    ).rejects.toThrow('Stripe unavailable')

    expect(mockTransaction).toHaveBeenCalledOnce()
    expect(mockRegistrationUpdate).toHaveBeenCalledWith({
      where: { id: 'reg-1' },
      data: expect.objectContaining({
        status: RegistrationStatus.CONFIRMED,
        paymentStatus: PaymentStatus.PAID,
        cancelledAt: null,
      }),
    })
    expect(mockPaymentUpdate).toHaveBeenCalledWith({
      where: { id: 'pay-1' },
      data: expect.objectContaining({
        status: PaymentStatus.PAID,
        refundAmount: null,
        refundedAt: null,
      }),
    })
  })

  it('calls the onRevert callback when provided and Stripe fails', async () => {
    mockRefundCreate.mockRejectedValue(new Error('fail'))
    const onRevert = vi.fn().mockResolvedValue(undefined)

    await expect(
      issueStripeRefundAfterDbUpdate({
        registrationId: 'reg-1',
        latestPayment: PAYMENT,
        previousPaymentStatus: PaymentStatus.PAID,
        idempotencyPrefix: 'refund',
        onRevert,
      }),
    ).rejects.toThrow('fail')

    expect(onRevert).toHaveBeenCalledOnce()
  })

  it('does not call onRevert when Stripe succeeds', async () => {
    const onRevert = vi.fn()

    await issueStripeRefundAfterDbUpdate({
      registrationId: 'reg-1',
      latestPayment: PAYMENT,
      previousPaymentStatus: PaymentStatus.PAID,
      idempotencyPrefix: 'refund',
      onRevert,
    })

    expect(onRevert).not.toHaveBeenCalled()
    expect(mockTransaction).not.toHaveBeenCalled()
  })
})
