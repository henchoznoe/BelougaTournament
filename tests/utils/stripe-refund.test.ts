/**
 * File: tests/utils/stripe-refund.test.ts
 * Description: Unit tests for the Stripe refund helpers (computeRefundAmount and refundPaymentViaStripe).
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

const mockRefundCreate = vi.fn()
const mockPaymentIntentRetrieve = vi.fn()
vi.mock('@/lib/core/stripe', () => ({
  getStripe: () => ({
    refunds: { create: (...args: unknown[]) => mockRefundCreate(...args) },
    paymentIntents: {
      retrieve: (...args: unknown[]) => mockPaymentIntentRetrieve(...args),
    },
  }),
}))

const { computeRefundAmount, refundPaymentViaStripe } = await import(
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
    expect(computeRefundAmount(5200, 200, 1000)).toBe(4048)
  })

  it('uses hypothetical fee for small donation', () => {
    expect(computeRefundAmount(1500, 74, 1000)).toBe(455)
  })

  it('falls back to refundable without fee when stripeFee is null and donation present', () => {
    expect(computeRefundAmount(1500, null, 1000)).toBe(500)
  })

  it('deducts real fee when donation is 0', () => {
    expect(computeRefundAmount(5000, 150, 0)).toBe(4850)
  })
})

// ---------------------------------------------------------------------------
// refundPaymentViaStripe
// ---------------------------------------------------------------------------

const PAYMENT = {
  id: 'pay-1',
  amount: 5000,
  stripeFee: 150,
  donationAmount: null,
  stripePaymentIntentId: 'pi_123',
  stripeChargeId: null,
}

describe('refundPaymentViaStripe', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRefundCreate.mockResolvedValue({ id: 're_123' })
  })

  it('refunds via payment_intent with deducted amount, metadata and idempotency key', async () => {
    const result = await refundPaymentViaStripe({
      payment: PAYMENT,
      registrationId: 'reg-1',
      idempotencyPrefix: 'refund',
    })

    expect(mockRefundCreate).toHaveBeenCalledWith(
      {
        payment_intent: 'pi_123',
        amount: 4850,
        reason: 'requested_by_customer',
        metadata: { registrationId: 'reg-1', kind: 'full_cancellation' },
      },
      { idempotencyKey: 'refund-reg-1-pay-1' },
    )
    expect(mockPaymentIntentRetrieve).not.toHaveBeenCalled()
    expect(result).toEqual({ stripeRefundId: 're_123', refundAmount: 4850 })
  })

  it('falls back to charge ID when payment_intent is null', async () => {
    await refundPaymentViaStripe({
      payment: {
        ...PAYMENT,
        stripePaymentIntentId: null,
        stripeChargeId: 'ch_abc',
      },
      registrationId: 'reg-1',
      idempotencyPrefix: 'refund',
    })

    expect(mockRefundCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        charge: 'ch_abc',
        metadata: { registrationId: 'reg-1', kind: 'full_cancellation' },
      }),
      { idempotencyKey: 'refund-reg-1-pay-1' },
    )
  })

  it('passes an undefined charge when neither payment_intent nor charge is present', async () => {
    await refundPaymentViaStripe({
      payment: {
        ...PAYMENT,
        stripePaymentIntentId: null,
        stripeChargeId: null,
      },
      registrationId: 'reg-1',
      idempotencyPrefix: 'refund',
    })

    expect(mockRefundCreate).toHaveBeenCalledWith(
      expect.objectContaining({ charge: undefined }),
      expect.any(Object),
    )
  })

  it('rethrows when the Stripe refund call fails (no DB mutation here)', async () => {
    mockRefundCreate.mockRejectedValue(new Error('Stripe unavailable'))

    await expect(
      refundPaymentViaStripe({
        payment: PAYMENT,
        registrationId: 'reg-1',
        idempotencyPrefix: 'refund',
      }),
    ).rejects.toThrow('Stripe unavailable')
  })

  describe('Stripe fee backfill when stripeFee is null', () => {
    it('retrieves the real fee from the balance transaction before computing', async () => {
      mockPaymentIntentRetrieve.mockResolvedValue({
        latest_charge: { balance_transaction: { fee: 74 } },
      })

      const result = await refundPaymentViaStripe({
        payment: {
          ...PAYMENT,
          amount: 1500,
          stripeFee: null,
          donationAmount: 1000,
        },
        registrationId: 'reg-1',
        idempotencyPrefix: 'refund',
      })

      expect(mockPaymentIntentRetrieve).toHaveBeenCalledWith('pi_123', {
        expand: ['latest_charge.balance_transaction'],
      })
      // refundable 500 - hypotheticalFee 45 = 455
      expect(result.refundAmount).toBe(455)
    })

    it('keeps the fee unknown when the charge is not expanded (string id)', async () => {
      mockPaymentIntentRetrieve.mockResolvedValue({ latest_charge: 'ch_str' })

      const result = await refundPaymentViaStripe({
        payment: { ...PAYMENT, stripeFee: null, donationAmount: null },
        registrationId: 'reg-1',
        idempotencyPrefix: 'refund',
      })

      expect(result.refundAmount).toBe(5000)
    })

    it('keeps the fee unknown when there is no charge on the intent', async () => {
      mockPaymentIntentRetrieve.mockResolvedValue({ latest_charge: null })

      const result = await refundPaymentViaStripe({
        payment: { ...PAYMENT, stripeFee: null, donationAmount: null },
        registrationId: 'reg-1',
        idempotencyPrefix: 'refund',
      })

      expect(result.refundAmount).toBe(5000)
    })

    it('keeps the fee unknown when the balance transaction is not expanded (string id)', async () => {
      mockPaymentIntentRetrieve.mockResolvedValue({
        latest_charge: { balance_transaction: 'txn_str' },
      })

      const result = await refundPaymentViaStripe({
        payment: { ...PAYMENT, stripeFee: null, donationAmount: null },
        registrationId: 'reg-1',
        idempotencyPrefix: 'refund',
      })

      expect(result.refundAmount).toBe(5000)
    })

    it('keeps the fee unknown when the retrieve call throws', async () => {
      mockPaymentIntentRetrieve.mockRejectedValue(new Error('boom'))

      const result = await refundPaymentViaStripe({
        payment: { ...PAYMENT, stripeFee: null, donationAmount: null },
        registrationId: 'reg-1',
        idempotencyPrefix: 'refund',
      })

      expect(result.refundAmount).toBe(5000)
    })

    it('does not retrieve the fee when there is no payment_intent', async () => {
      const result = await refundPaymentViaStripe({
        payment: {
          ...PAYMENT,
          stripeFee: null,
          donationAmount: null,
          stripePaymentIntentId: null,
          stripeChargeId: 'ch_abc',
        },
        registrationId: 'reg-1',
        idempotencyPrefix: 'refund',
      })

      expect(mockPaymentIntentRetrieve).not.toHaveBeenCalled()
      expect(result.refundAmount).toBe(5000)
    })
  })
})
