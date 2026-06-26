/**
 * File: tests/utils/payment-summary.test.ts
 * Description: Unit tests for kept-payment summarisation helpers.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { describe, expect, it } from 'vitest'
import {
  type CountablePayment,
  isKeptPayment,
  summarizeKeptPayments,
} from '@/lib/utils/payment-summary'
import { PaymentStatus } from '@/prisma/generated/prisma/enums'

describe('isKeptPayment', () => {
  it('counts PAID and FORFEITED as kept', () => {
    expect(isKeptPayment(PaymentStatus.PAID)).toBe(true)
    expect(isKeptPayment(PaymentStatus.FORFEITED)).toBe(true)
  })

  it('does not count refunded or non-final statuses', () => {
    for (const status of [
      PaymentStatus.REFUNDED,
      PaymentStatus.PENDING,
      PaymentStatus.UNPAID,
      PaymentStatus.CANCELLED,
      PaymentStatus.FAILED,
      PaymentStatus.NOT_REQUIRED,
    ]) {
      expect(isKeptPayment(status)).toBe(false)
    }
  })
})

describe('summarizeKeptPayments', () => {
  const payment = (
    status: PaymentStatus,
    amount: number,
    currency = 'CHF',
  ): CountablePayment => ({ status, amount, currency })

  it('returns zero total for an empty list', () => {
    expect(summarizeKeptPayments([])).toEqual({ total: 0, currencies: [] })
  })

  it('sums PAID and FORFEITED amounts', () => {
    const result = summarizeKeptPayments([
      payment(PaymentStatus.PAID, 500),
      payment(PaymentStatus.FORFEITED, 500),
    ])
    expect(result.total).toBe(1000)
    expect(result.currencies).toEqual(['CHF'])
  })

  it('counts a forfeited-only payment (the reported bug)', () => {
    const result = summarizeKeptPayments([
      payment(PaymentStatus.FORFEITED, 500),
    ])
    expect(result.total).toBe(500)
    expect(result.currencies).toEqual(['CHF'])
  })

  it('excludes refunded and pending payments from the total', () => {
    const result = summarizeKeptPayments([
      payment(PaymentStatus.PAID, 500),
      payment(PaymentStatus.REFUNDED, 800),
      payment(PaymentStatus.PENDING, 300),
    ])
    expect(result.total).toBe(500)
  })

  it('collects unique uppercased currencies from kept payments only', () => {
    const result = summarizeKeptPayments([
      payment(PaymentStatus.PAID, 500, 'chf'),
      payment(PaymentStatus.FORFEITED, 500, 'CHF'),
      payment(PaymentStatus.PAID, 200, 'eur'),
      payment(PaymentStatus.REFUNDED, 999, 'usd'),
    ])
    expect(result.total).toBe(1200)
    expect(result.currencies).toEqual(['CHF', 'EUR'])
  })
})
