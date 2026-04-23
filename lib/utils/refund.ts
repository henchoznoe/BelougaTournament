/**
 * File: lib/utils/refund.ts
 * Description: Shared helpers for refund amount calculations independent of Stripe side effects.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import {
  STRIPE_FEE_FIXED_CENTIMES,
  STRIPE_FEE_PERCENT,
  STRIPE_FEE_PERCENT_DIVISOR,
} from '@/lib/config/constants/validation'

/**
 * Computes the amount to refund in centimes.
 * Deducts the donation amount (never refundable) and the Stripe processing fee
 * when known; falls back to the full amount minus donation when the fee has not
 * yet been recorded (e.g. balance_transaction not yet created).
 *
 * When a donation was part of the transaction, Stripe fees are recalculated as
 * if only the refundable portion had been charged (hypothetical fee). This
 * avoids penalising the player with fees inflated by their voluntary donation.
 */
export const computeRefundAmount = (
  amount: number,
  stripeFee: number | null,
  donationAmount = 0,
): number => {
  const refundable = amount - donationAmount

  if (stripeFee === null) {
    return refundable
  }

  if (donationAmount === 0) {
    return refundable - stripeFee
  }

  // Recalculate hypothetical Stripe fee on the refundable portion only so the
  // player does not absorb fees caused by the donation component.
  const hypotheticalFee = Math.round(
    (refundable * STRIPE_FEE_PERCENT) / STRIPE_FEE_PERCENT_DIVISOR +
      STRIPE_FEE_FIXED_CENTIMES,
  )
  return refundable - hypotheticalFee
}
