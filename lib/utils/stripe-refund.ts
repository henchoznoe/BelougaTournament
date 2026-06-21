/**
 * File: lib/utils/stripe-refund.ts
 * Description: Stripe-first refund helper. Issues the Stripe refund BEFORE any DB
 *   mutation so the database is never marked refunded without money actually moving.
 *   The charge.refunded webhook reconciles the DB state as the source of truth.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import 'server-only'
import { getStripe } from '@/lib/core/stripe'
import { computeRefundAmount } from '@/lib/utils/refund'

export { computeRefundAmount } from '@/lib/utils/refund'

/** Metadata tag attached to app-issued refunds so the webhook can recognise a full cancellation. */
export const REFUND_KIND_FULL_CANCELLATION = 'full_cancellation'

type RefundablePayment = {
  id: string
  amount: number
  stripeFee: number | null
  donationAmount: number | null
  stripePaymentIntentId: string | null
  stripeChargeId: string | null
}

/**
 * Retrieves the real Stripe processing fee from the balance transaction when it
 * was not yet recorded on the payment. Prevents the organisation from absorbing
 * the fee when a refund is issued before charge.updated has backfilled it.
 */
const resolveStripeFee = async (
  payment: RefundablePayment,
): Promise<number | null> => {
  if (payment.stripeFee !== null) {
    return payment.stripeFee
  }
  if (!payment.stripePaymentIntentId) {
    return null
  }

  try {
    const stripe = getStripe()
    const paymentIntent = await stripe.paymentIntents.retrieve(
      payment.stripePaymentIntentId,
      { expand: ['latest_charge.balance_transaction'] },
    )
    const charge = paymentIntent.latest_charge
    if (charge && typeof charge !== 'string') {
      const bt = charge.balance_transaction
      if (bt && typeof bt !== 'string') {
        return bt.fee
      }
    }
  } catch {
    // Fee stays unknown; computeRefundAmount falls back to the full refundable amount.
  }
  return null
}

/**
 * Issues a Stripe refund FIRST, then returns the refund id and amount so the caller
 * can persist the DB state in its own transaction. Throws if the Stripe call fails —
 * the caller must leave the registration untouched (no money moved, no DB mutation).
 * The idempotency key makes the call safe to retry; metadata lets the webhook
 * reconcile the cancellation even if the caller crashes before its DB write.
 */
export const refundPaymentViaStripe = async ({
  payment,
  registrationId,
  idempotencyPrefix,
}: {
  payment: RefundablePayment
  registrationId: string
  idempotencyPrefix: string
}): Promise<{ stripeRefundId: string; refundAmount: number }> => {
  const stripe = getStripe()
  const stripeFee = await resolveStripeFee(payment)
  const refundAmount = computeRefundAmount(
    payment.amount,
    stripeFee,
    payment.donationAmount ?? 0,
  )

  const refund = await stripe.refunds.create(
    payment.stripePaymentIntentId
      ? {
          payment_intent: payment.stripePaymentIntentId,
          amount: refundAmount,
          reason: 'requested_by_customer',
          metadata: { registrationId, kind: REFUND_KIND_FULL_CANCELLATION },
        }
      : {
          charge: payment.stripeChargeId ?? undefined,
          amount: refundAmount,
          reason: 'requested_by_customer',
          metadata: { registrationId, kind: REFUND_KIND_FULL_CANCELLATION },
        },
    {
      idempotencyKey: `${idempotencyPrefix}-${registrationId}-${payment.id}`,
    },
  )

  return { stripeRefundId: refund.id, refundAmount }
}
