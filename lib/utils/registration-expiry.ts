/**
 * File: lib/utils/registration-expiry.ts
 * Description: Server-only helpers that clean up expired pending registrations.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import 'server-only'
import { updateTag } from 'next/cache'
import { CACHE_TAGS } from '@/lib/config/constants'
import prisma from '@/lib/core/prisma'
import { removeUserFromTeam } from '@/lib/utils/team'
import {
  PaymentStatus,
  RegistrationStatus,
} from '@/prisma/generated/prisma/enums'

/**
 * Expires any stale PENDING registrations for a user.
 *
 * This is the server-side safety net when the browser never returns from Stripe
 * or a webhook delivery is delayed/missed. Team memberships are cleaned up so a
 * stale pending captain does not keep blocking a team slot.
 */
export const cleanupExpiredPendingRegistrations = async (
  userId: string,
  now = new Date(),
): Promise<number> => {
  const staleRegistrations = await prisma.tournamentRegistration.findMany({
    where: {
      userId,
      status: RegistrationStatus.PENDING,
      expiresAt: { not: null, lte: now },
    },
    select: {
      id: true,
      tournamentId: true,
    },
  })

  for (const registration of staleRegistrations) {
    await prisma.$transaction(async tx => {
      const currentRegistration = await tx.tournamentRegistration.findUnique({
        where: { id: registration.id },
        select: {
          id: true,
          status: true,
          tournamentId: true,
          expiresAt: true,
        },
      })

      if (
        !currentRegistration ||
        currentRegistration.status !== RegistrationStatus.PENDING ||
        currentRegistration.expiresAt === null ||
        currentRegistration.expiresAt > now
      ) {
        return
      }

      await removeUserFromTeam(tx, userId, currentRegistration.tournamentId)

      await tx.payment.updateMany({
        where: {
          registrationId: currentRegistration.id,
          status: { in: [PaymentStatus.PENDING, PaymentStatus.UNPAID] },
        },
        data: { status: PaymentStatus.CANCELLED },
      })

      await tx.tournamentRegistration.update({
        where: { id: currentRegistration.id },
        data: {
          status: RegistrationStatus.EXPIRED,
          paymentStatus: PaymentStatus.CANCELLED,
          teamId: null,
          expiresAt: now,
        },
      })
    })
  }

  if (staleRegistrations.length > 0) {
    updateTag(CACHE_TAGS.TOURNAMENTS)
    updateTag(CACHE_TAGS.DASHBOARD_REGISTRATIONS)
    updateTag(CACHE_TAGS.DASHBOARD_STATS)
    updateTag(CACHE_TAGS.DASHBOARD_PAYMENTS)
  }

  return staleRegistrations.length
}
