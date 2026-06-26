/**
 * File: lib/utils/payment-summary.ts
 * Description: Helpers for summarising payments the organisation actually kept.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { PaymentStatus } from '@/prisma/generated/prisma/enums'

/**
 * Payment statuses representing money the organisation actually kept.
 * FORFEITED = the player cancelled but waived their refund, so the fee was
 * received and retained just like a regular PAID payment. REFUNDED is excluded
 * (money returned to the player → net contribution of zero).
 */
const KEPT_PAYMENT_STATUSES = new Set<PaymentStatus>([
  PaymentStatus.PAID,
  PaymentStatus.FORFEITED,
])

export const isKeptPayment = (status: PaymentStatus): boolean =>
  KEPT_PAYMENT_STATUSES.has(status)

export type CountablePayment = {
  status: PaymentStatus
  amount: number
  currency: string
}

/** Sums the centimes the organisation kept, with the set of currencies involved. */
export const summarizeKeptPayments = (
  payments: CountablePayment[],
): { total: number; currencies: string[] } => {
  let total = 0
  const currencies = new Set<string>()
  for (const payment of payments) {
    if (isKeptPayment(payment.status)) {
      total += payment.amount
      currencies.add(payment.currency.toUpperCase())
    }
  }
  return { total, currencies: [...currencies] }
}
