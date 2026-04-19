/**
 * File: lib/actions/tournament-unregistration.ts
 * Description: Server action for player self-unregistration from tournaments.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

'use server'

import { revalidateTag } from 'next/cache'
import { authenticatedAction } from '@/lib/actions/safe-action'
import { CACHE_TAGS } from '@/lib/config/constants'
import prisma from '@/lib/core/prisma'
import type { ActionState } from '@/lib/types/actions'
import type { TeamMemberWithTeam } from '@/lib/types/team'
import { issueStripeRefundAfterDbUpdate } from '@/lib/utils/stripe-refund'
import { handleCaptainSuccession } from '@/lib/utils/team'
import { isRefundEligible } from '@/lib/utils/tournament-helpers'
import { unregisterFromTournamentSchema } from '@/lib/validations/tournaments'
import {
  PaymentStatus,
  type RefundPolicyType,
  RegistrationStatus,
  TournamentFormat,
  TournamentStatus,
} from '@/prisma/generated/prisma/enums'

// ---------------------------------------------------------------------------
// Local query result types
// ---------------------------------------------------------------------------

/** Registration with minimal tournament info. Used by unregisterFromTournament. */
type RegistrationWithTournamentInfo = {
  id: string
  paymentStatus: PaymentStatus
  status: RegistrationStatus
  paymentRequiredSnapshot: boolean
  teamId: string | null
  userId: string
  payments: {
    id: string
    status: PaymentStatus
    amount: number
    stripePaymentIntentId: string | null
    stripeChargeId: string | null
  }[]
  tournament: {
    status: TournamentStatus
    format: TournamentFormat
    startDate: Date
    refundPolicyType: RefundPolicyType
    refundDeadlineDays: number | null
  }
}

// ---------------------------------------------------------------------------
// Public action
// ---------------------------------------------------------------------------

/** Cancels a player's own registration. For team tournaments, handles captain succession or team dissolution. */
export const unregisterFromTournament = authenticatedAction({
  schema: unregisterFromTournamentSchema,
  handler: async (data, session): Promise<ActionState> => {
    const userId = session.user.id

    // 1. Fetch the registration with tournament info
    const registration = (await prisma.tournamentRegistration.findUnique({
      where: {
        tournamentId_userId: {
          tournamentId: data.tournamentId,
          userId,
        },
      },
      include: {
        payments: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            id: true,
            status: true,
            amount: true,
            stripePaymentIntentId: true,
            stripeChargeId: true,
          },
        },
        tournament: {
          select: {
            status: true,
            format: true,
            startDate: true,
            refundPolicyType: true,
            refundDeadlineDays: true,
          },
        },
      },
    })) as RegistrationWithTournamentInfo | null

    if (!registration) {
      return { success: false, message: 'Inscription introuvable.' }
    }

    if (registration.tournament.status !== TournamentStatus.PUBLISHED) {
      return {
        success: false,
        message: 'Ce tournoi ne permet plus de désinscription.',
      }
    }

    if (new Date() >= registration.tournament.startDate) {
      return {
        success: false,
        message:
          'Le tournoi a déjà commencé. La désinscription est indisponible.',
      }
    }

    const latestPayment = registration.payments[0] ?? null
    const refundEligible =
      registration.paymentStatus === PaymentStatus.PAID &&
      isRefundEligible(
        registration.tournament.startDate,
        registration.tournament.refundPolicyType,
        registration.tournament.refundDeadlineDays,
        new Date(),
      )
    const isPaidRegistration = registration.paymentRequiredSnapshot

    // 3. SOLO format — cancel paid registrations, delete free registrations
    if (registration.tournament.format === TournamentFormat.SOLO) {
      if (isPaidRegistration) {
        await prisma.$transaction(async tx => {
          await tx.tournamentRegistration.update({
            where: { id: registration.id },
            data: {
              status: RegistrationStatus.CANCELLED,
              paymentStatus: refundEligible
                ? PaymentStatus.REFUNDED
                : registration.paymentStatus,
              cancelledAt: new Date(),
              expiresAt: null,
            },
          })

          if (refundEligible && latestPayment) {
            await tx.payment.update({
              where: { id: latestPayment.id },
              data: {
                status: PaymentStatus.REFUNDED,
                refundAmount: latestPayment.amount,
                refundedAt: new Date(),
              },
            })
          }
        })
      } else {
        await prisma.tournamentRegistration.delete({
          where: { id: registration.id },
        })
      }

      // Issue Stripe refund after DB update (DB-first pattern)
      if (refundEligible && latestPayment) {
        await issueStripeRefundAfterDbUpdate({
          registrationId: registration.id,
          latestPayment,
          previousPaymentStatus: registration.paymentStatus,
          idempotencyPrefix: 'refund',
        })
      }

      revalidateTag(CACHE_TAGS.TOURNAMENTS, 'hours')
      revalidateTag(CACHE_TAGS.DASHBOARD_REGISTRATIONS, 'minutes')
      revalidateTag(CACHE_TAGS.DASHBOARD_STATS, 'minutes')
      revalidateTag(CACHE_TAGS.DASHBOARD_PAYMENTS, 'minutes')

      return {
        success: true,
        message: refundEligible
          ? 'Votre inscription a été annulée et remboursée.'
          : "Votre inscription a été annulée. Cette désinscription n'ouvre pas droit à un remboursement automatique.",
      }
    }

    // 4. TEAM format — find the user's team membership
    const teamMember = (await prisma.teamMember.findFirst({
      where: { userId, team: { tournamentId: data.tournamentId } },
      include: {
        team: {
          include: {
            tournament: { select: { teamSize: true } },
            members: { orderBy: { joinedAt: 'asc' } },
          },
        },
      },
    })) as TeamMemberWithTeam | null

    if (!teamMember) {
      // Edge case: has a registration but no team membership (shouldn't happen, but clean up)
      if (isPaidRegistration) {
        await prisma.$transaction(async tx => {
          await tx.tournamentRegistration.update({
            where: { id: registration.id },
            data: {
              status: RegistrationStatus.CANCELLED,
              paymentStatus: refundEligible
                ? PaymentStatus.REFUNDED
                : registration.paymentStatus,
              cancelledAt: new Date(),
              teamId: null,
              expiresAt: null,
            },
          })

          if (refundEligible && latestPayment) {
            await tx.payment.update({
              where: { id: latestPayment.id },
              data: {
                status: PaymentStatus.REFUNDED,
                refundAmount: latestPayment.amount,
                refundedAt: new Date(),
              },
            })
          }
        })
      } else {
        await prisma.tournamentRegistration.delete({
          where: { id: registration.id },
        })
      }

      // Issue Stripe refund after DB update (DB-first pattern)
      if (refundEligible && latestPayment) {
        await issueStripeRefundAfterDbUpdate({
          registrationId: registration.id,
          latestPayment,
          previousPaymentStatus: registration.paymentStatus,
          idempotencyPrefix: 'refund',
        })
      }

      revalidateTag(CACHE_TAGS.TOURNAMENTS, 'hours')
      revalidateTag(CACHE_TAGS.DASHBOARD_REGISTRATIONS, 'minutes')
      revalidateTag(CACHE_TAGS.DASHBOARD_STATS, 'minutes')
      revalidateTag(CACHE_TAGS.DASHBOARD_PAYMENTS, 'minutes')

      return {
        success: true,
        message: refundEligible
          ? 'Votre inscription a été annulée et remboursée.'
          : "Votre inscription a été annulée. Cette désinscription n'ouvre pas droit à un remboursement automatique.",
      }
    }

    const team = teamMember.team

    // Save pre-mutation state for potential Stripe revert
    const teamRevertInfo = {
      teamId: team.id,
      userId,
      joinedAt: teamMember.joinedAt,
      captainId: team.captainId,
      isFull: team.isFull,
      teamWasDeleted: team.members.length === 1,
      teamName: team.name,
      tournamentId: data.tournamentId,
    }

    await prisma.$transaction(async tx => {
      // a. Remove team member record
      await tx.teamMember.deleteMany({
        where: { teamId: team.id, userId },
      })

      // b. Cancel or delete the tournament registration depending on payment history
      if (isPaidRegistration) {
        await tx.tournamentRegistration.update({
          where: { id: registration.id },
          data: {
            status: RegistrationStatus.CANCELLED,
            paymentStatus: refundEligible
              ? PaymentStatus.REFUNDED
              : registration.paymentStatus,
            cancelledAt: new Date(),
            teamId: null,
            expiresAt: null,
          },
        })

        if (refundEligible && latestPayment) {
          await tx.payment.update({
            where: { id: latestPayment.id },
            data: {
              status: PaymentStatus.REFUNDED,
              refundAmount: latestPayment.amount,
              refundedAt: new Date(),
            },
          })
        }
      } else {
        await tx.tournamentRegistration.delete({
          where: { id: registration.id },
        })
      }

      // c. Handle captain succession / team cleanup
      await handleCaptainSuccession(tx, team, userId)
    })

    // Issue Stripe refund after DB update (DB-first pattern)
    if (refundEligible && latestPayment) {
      await issueStripeRefundAfterDbUpdate({
        registrationId: registration.id,
        latestPayment,
        previousPaymentStatus: registration.paymentStatus,
        idempotencyPrefix: 'refund',
        onRevert: async tx => {
          // Restore team membership that was removed during the DB-first phase
          if (teamRevertInfo.teamWasDeleted) {
            await tx.team.create({
              data: {
                id: teamRevertInfo.teamId,
                name: teamRevertInfo.teamName,
                tournamentId: teamRevertInfo.tournamentId,
                captainId: teamRevertInfo.captainId,
                isFull: teamRevertInfo.isFull,
              },
            })
          } else {
            await tx.team.update({
              where: { id: teamRevertInfo.teamId },
              data: {
                captainId: teamRevertInfo.captainId,
                isFull: teamRevertInfo.isFull,
              },
            })
          }

          await tx.teamMember.create({
            data: {
              teamId: teamRevertInfo.teamId,
              userId: teamRevertInfo.userId,
              joinedAt: teamRevertInfo.joinedAt,
            },
          })

          await tx.tournamentRegistration.update({
            where: { id: registration.id },
            data: { teamId: teamRevertInfo.teamId },
          })
        },
      })
    }

    revalidateTag(CACHE_TAGS.TOURNAMENTS, 'hours')
    revalidateTag(CACHE_TAGS.DASHBOARD_REGISTRATIONS, 'minutes')
    revalidateTag(CACHE_TAGS.DASHBOARD_STATS, 'minutes')
    revalidateTag(CACHE_TAGS.DASHBOARD_PAYMENTS, 'minutes')

    return {
      success: true,
      message: refundEligible
        ? 'Votre inscription a été annulée et remboursée.'
        : "Votre inscription a été annulée. Cette désinscription n'ouvre pas droit à un remboursement automatique.",
    }
  },
})
