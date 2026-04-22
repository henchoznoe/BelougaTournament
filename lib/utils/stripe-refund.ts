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
    donationAmount: number | null
    stripePaymentIntentId: string | null
    stripeChargeId: string | null
  }
  previousPaymentStatus: PaymentStatus
  idempotencyPrefix: string
  onRevert?: (tx: PrismaTransaction) => Promise<void>
}): Promise<void> => {
  try {
    const stripe = getStripe()
    const refundAmount = computeRefundAmount(
      latestPayment.amount,
      latestPayment.stripeFee,
      latestPayment.donationAmount ?? 0,
    )
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
    try {
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
    } catch (revertError) {
      logger.error(
        {
          registrationId,
          stripeErrorMessage:
            error instanceof Error ? error.message : 'unknown Stripe error',
          revertErrorMessage:
            revertError instanceof Error
              ? revertError.message
              : 'unknown revert error',
        },
        'Stripe refund failed and DB revert also failed',
      )

      throw new Error(
        `Stripe refund failed and DB revert also failed for registration ${registrationId}. Manual reconciliation required.`,
      )
    }

    throw error
  }
}
