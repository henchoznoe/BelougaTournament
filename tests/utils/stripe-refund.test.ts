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

const mockLoggerError = vi.fn()
vi.mock('@/lib/core/logger', () => ({
  logger: {
    error: (...args: unknown[]) => mockLoggerError(...args),
    warn: vi.fn(),
    info: vi.fn(),
  },
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

  it('uses hypothetical fee when donation is present', () => {
    // 5200 total, 200 real fee, 1000 donation
    // refundable = 5200 - 1000 = 4200
    // hypotheticalFee = round((4200 * 2.9) / 100 + 30) = round(151.8) = 152
    // refund = 4200 - 152 = 4048
    expect(computeRefundAmount(5200, 200, 1000)).toBe(4048)
  })

  it('uses hypothetical fee for small donation', () => {
    // 1500 total, 74 real fee, 1000 donation
    // refundable = 1500 - 1000 = 500
    // hypotheticalFee = round((500 * 2.9) / 100 + 30) = round(44.5) = 45
    // refund = 500 - 45 = 455
    expect(computeRefundAmount(1500, 74, 1000)).toBe(455)
  })

  it('falls back to refundable without fee when stripeFee is null and donation present', () => {
    // 1500 total, null fee, 1000 donation → refundable = 500
    expect(computeRefundAmount(1500, null, 1000)).toBe(500)
  })

  it('deducts real fee when donation is 0', () => {
    // Same behaviour as no-donation path
    expect(computeRefundAmount(5000, 150, 0)).toBe(4850)
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

  it('passes an undefined charge when neither payment_intent nor charge is present', async () => {
    await issueStripeRefundAfterDbUpdate({
      registrationId: 'reg-1',
      latestPayment: {
        ...PAYMENT,
        stripePaymentIntentId: null,
        stripeChargeId: null,
      },
      previousPaymentStatus: PaymentStatus.PAID,
      idempotencyPrefix: 'refund',
    })

    expect(mockRefundCreate).toHaveBeenCalledWith(
      {
        charge: undefined,
        amount: 4850,
        reason: 'requested_by_customer',
      },
      { idempotencyKey: 'refund-reg-1-pay-1' },
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

  it('surfaces a manual reconciliation error when the DB revert also fails', async () => {
    mockRefundCreate.mockRejectedValue(new Error('Stripe unavailable'))
    mockTransaction.mockRejectedValue(new Error('DB revert failed'))

    await expect(
      issueStripeRefundAfterDbUpdate({
        registrationId: 'reg-1',
        latestPayment: PAYMENT,
        previousPaymentStatus: PaymentStatus.PAID,
        idempotencyPrefix: 'refund',
      }),
    ).rejects.toThrow('Manual reconciliation required.')

    expect(mockTransaction).toHaveBeenCalledOnce()
    expect(mockRegistrationUpdate).not.toHaveBeenCalled()
    expect(mockPaymentUpdate).not.toHaveBeenCalled()
  })

  it('logs fallback unknown messages for non-Error Stripe and revert failures', async () => {
    mockRefundCreate.mockRejectedValue('stripe failure')
    mockTransaction.mockRejectedValue({ reason: 'db revert failed' })

    await expect(
      issueStripeRefundAfterDbUpdate({
        registrationId: 'reg-1',
        latestPayment: PAYMENT,
        previousPaymentStatus: PaymentStatus.PAID,
        idempotencyPrefix: 'refund',
      }),
    ).rejects.toThrow('Manual reconciliation required.')

    expect(mockLoggerError).toHaveBeenNthCalledWith(
      2,
      {
        registrationId: 'reg-1',
        stripeErrorMessage: 'unknown Stripe error',
        revertErrorMessage: 'unknown revert error',
      },
      'Stripe refund failed and DB revert also failed',
    )
  })

  it('uses hypothetical fee when donation is present', async () => {
    await issueStripeRefundAfterDbUpdate({
      registrationId: 'reg-1',
      latestPayment: {
        ...PAYMENT,
        amount: 1500,
        stripeFee: 74,
        donationAmount: 1000,
      },
      previousPaymentStatus: PaymentStatus.PAID,
      idempotencyPrefix: 'refund',
    })

    // refundable = 1500 - 1000 = 500
    // hypotheticalFee = round((500 * 2.9) / 100 + 30) = 45
    // refund = 500 - 45 = 455
    expect(mockRefundCreate).toHaveBeenCalledWith(
      {
        payment_intent: 'pi_123',
        amount: 455,
        reason: 'requested_by_customer',
      },
      { idempotencyKey: 'refund-reg-1-pay-1' },
    )
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
