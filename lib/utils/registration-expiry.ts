/**
 * File: lib/utils/registration-expiry.ts
 * Description: Server-only helpers that clean up expired pending registrations.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import 'server-only'
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
): Promise<{ tournamentId: string; userId: string }[]> => {
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

  if (staleRegistrations.length === 0) return []
  return prisma.$transaction(async tx => {
    const expired: { tournamentId: string; userId: string }[] = []
    for (const registration of staleRegistrations) {
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
        continue
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
      expired.push({ tournamentId: registration.tournamentId, userId })
    }
    return expired
  })
}
