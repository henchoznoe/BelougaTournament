/**
 * File: lib/utils/stripe-refund.ts
 * Description: Shared Stripe refund helper with DB-first pattern and revert on failure.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import 'server-only'
import { logger } from '@/lib/core/logger'
import prisma from '@/lib/core/prisma'
import { getStripe } from '@/lib/core/stripe'
import {
  type PaymentStatus,
  RegistrationStatus,
} from '@/prisma/generated/prisma/enums'

type PrismaTransaction = Parameters<
  Parameters<typeof prisma.$transaction>[0]
>[0]

/**
 * Issues a Stripe refund AFTER the DB has already been updated to REFUNDED state.
 * If the Stripe API call fails, reverts the DB records back to their pre-refund state.
 * Uses an idempotency key to ensure the refund is safe to retry.
 */
export const issueStripeRefundAfterDbUpdate = async ({
  registrationId,
  latestPayment,
  previousPaymentStatus,
  idempotencyPrefix,
  onRevert,
}: {
  registrationId: string
  latestPayment: {
    id: string
    amount: number
    stripeFee: number | null
    stripePaymentIntentId: string | null
    stripeChargeId: string | null
  }
  previousPaymentStatus: PaymentStatus
  idempotencyPrefix: string
  onRevert?: (tx: PrismaTransaction) => Promise<void>
}): Promise<void> => {
  try {
    const stripe = getStripe()
    // Refund the original amount minus Stripe processing fees (non-recoverable).
    // When stripeFee is unknown (null), fall back to a full refund.
    const refundAmount = latestPayment.stripeFee
      ? latestPayment.amount - latestPayment.stripeFee
      : latestPayment.amount
    await stripe.refunds.create(
      latestPayment.stripePaymentIntentId
        ? {
            payment_intent: latestPayment.stripePaymentIntentId,
            amount: refundAmount,
            reason: 'requested_by_customer',
          }
        : {
            charge: latestPayment.stripeChargeId ?? undefined,
            amount: refundAmount,
            reason: 'requested_by_customer',
          },
      {
        idempotencyKey: `${idempotencyPrefix}-${registrationId}-${latestPayment.id}`,
      },
    )
  } catch (error) {
    // Stripe refund failed — revert DB records back to pre-refund state
    logger.error(
      { error, registrationId },
      'Stripe refund failed, reverting DB state',
    )
    await prisma.$transaction(async tx => {
      await tx.tournamentRegistration.update({
        where: { id: registrationId },
        data: {
          status: RegistrationStatus.CONFIRMED,
          paymentStatus: previousPaymentStatus,
          cancelledAt: null,
        },
      })
      await tx.payment.update({
        where: { id: latestPayment.id },
        data: {
          status: previousPaymentStatus,
          refundAmount: null,
          refundedAt: null,
        },
      })
      if (onRevert) await onRevert(tx)
    })
    throw error
  }
}
