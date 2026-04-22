/**
 * File: lib/actions/registration-cancellation.ts
 * Description: Shared helpers for resolving registration cancellations, deletions, refunds, and forfeits.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import 'server-only'
import type prisma from '@/lib/core/prisma'
import { computeRefundAmount } from '@/lib/utils/refund'
import {
  PaymentStatus,
  RegistrationStatus,
} from '@/prisma/generated/prisma/enums'

type PrismaTransaction = Parameters<
  Parameters<typeof prisma.$transaction>[0]
>[0]

type RegistrationResolution = 'cancel' | 'refund' | 'forfeit'

interface LatestPaymentRecord {
  id: string
  amount: number
  stripeFee: number | null
  donationAmount: number | null
}

const resolveRegistrationPaymentStatus = (
  previousPaymentStatus: PaymentStatus,
  resolution: RegistrationResolution,
): PaymentStatus => {
  switch (resolution) {
    case 'refund':
      return PaymentStatus.REFUNDED
    case 'forfeit':
      return PaymentStatus.FORFEITED
    default:
      return previousPaymentStatus
  }
}

/** Cancels a paid registration or deletes a free one, updating the latest payment when needed. */
export const cancelOrDeleteRegistration = async ({
  tx,
  registrationId,
  paymentRequiredSnapshot,
  previousPaymentStatus,
  latestPayment,
  resolution = 'cancel',
  clearTeamId = true,
  clearExpiresAt = false,
  refundIncludesDonation = true,
}: {
  tx: PrismaTransaction
  registrationId: string
  paymentRequiredSnapshot: boolean
  previousPaymentStatus: PaymentStatus
  latestPayment?: LatestPaymentRecord | null
  resolution?: RegistrationResolution
  clearTeamId?: boolean
  clearExpiresAt?: boolean
  refundIncludesDonation?: boolean
}): Promise<void> => {
  if (!paymentRequiredSnapshot) {
    await tx.tournamentRegistration.delete({ where: { id: registrationId } })
    return
  }

  const paymentStatus = resolveRegistrationPaymentStatus(
    previousPaymentStatus,
    resolution,
  )

  await tx.tournamentRegistration.update({
    where: { id: registrationId },
    data: {
      status: RegistrationStatus.CANCELLED,
      paymentStatus,
      cancelledAt: new Date(),
      ...(clearTeamId ? { teamId: null } : {}),
      ...(clearExpiresAt ? { expiresAt: null } : {}),
    },
  })

  if (!latestPayment) {
    return
  }

  if (resolution === 'refund') {
    await tx.payment.update({
      where: { id: latestPayment.id },
      data: {
        status: PaymentStatus.REFUNDED,
        refundAmount: computeRefundAmount(
          latestPayment.amount,
          latestPayment.stripeFee,
          refundIncludesDonation ? (latestPayment.donationAmount ?? 0) : 0,
        ),
        refundedAt: new Date(),
      },
    })
  }

  if (resolution === 'forfeit') {
    await tx.payment.update({
      where: { id: latestPayment.id },
      data: { status: PaymentStatus.FORFEITED },
    })
  }
}
