/**
 * File: lib/utils/refund.ts
 * Description: Shared helpers for refund amount calculations independent of Stripe side effects.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

/**
 * Computes the amount to refund in centimes.
 * Deducts the donation amount (never refundable) and the Stripe processing fee
 * when known; falls back to the full amount minus donation when the fee has not
 * yet been recorded (e.g. balance_transaction not yet created).
 */
export const computeRefundAmount = (
  amount: number,
  stripeFee: number | null,
  donationAmount = 0,
): number => {
  const refundable = amount - donationAmount
  return stripeFee !== null ? refundable - stripeFee : refundable
}
