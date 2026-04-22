/**
 * File: lib/actions/tournament-unregistration.ts
 * Description: Server action for player self-unregistration from tournaments.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

'use server'

import { updateTag } from 'next/cache'
import { cancelOrDeleteRegistration } from '@/lib/actions/registration-cancellation'
import { authenticatedAction } from '@/lib/actions/safe-action'
import { CACHE_TAGS } from '@/lib/config/constants'
import prisma from '@/lib/core/prisma'
import type { ActionState } from '@/lib/types/actions'
import type { TeamMemberWithTeam } from '@/lib/types/team'
import { issueStripeRefundAfterDbUpdate } from '@/lib/utils/stripe-refund'
import {
  buildTeamRevertCallback,
  buildTeamRevertInfo,
  handleCaptainSuccession,
} from '@/lib/utils/team'
import { isRefundEligible } from '@/lib/utils/tournament-helpers'
import { unregisterFromTournamentSchema } from '@/lib/validations/tournaments'
import {
  PaymentStatus,
  type RefundPolicyType,
  type RegistrationStatus,
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
  refundDeadlineDaysSnapshot: number | null
  teamId: string | null
  userId: string
  payments: {
    id: string
    status: PaymentStatus
    amount: number
    stripeFee: number | null
    donationAmount: number | null
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
            stripeFee: true,
            donationAmount: true,
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

    // Use the snapshot captured at registration time so an admin can't shift
    // the refund window after a user has already purchased. Fall back to the
    // live tournament value only for legacy registrations that predate the
    // snapshot column (never for new registrations, which always populate it).
    const refundDeadlineDays =
      registration.refundDeadlineDaysSnapshot ??
      registration.tournament.refundDeadlineDays

    const isWithinRefundWindow =
      registration.paymentStatus === PaymentStatus.PAID &&
      isRefundEligible(
        registration.tournament.startDate,
        registration.tournament.refundPolicyType,
        refundDeadlineDays,
        new Date(),
      )
    // waiveRefund is only meaningful when within the refund window;
    // outside the window it has no effect (already no refund).
    const waiveRefund = data.waiveRefund === true && isWithinRefundWindow
    const refundEligible = isWithinRefundWindow && !waiveRefund
    const isPaidRegistration = registration.paymentRequiredSnapshot
    const resolution = refundEligible
      ? 'refund'
      : waiveRefund
        ? 'forfeit'
        : 'cancel'

    // 3. SOLO format — cancel paid registrations, delete free registrations
    if (registration.tournament.format === TournamentFormat.SOLO) {
      if (isPaidRegistration) {
        await prisma.$transaction(async tx => {
          await cancelOrDeleteRegistration({
            tx,
            registrationId: registration.id,
            paymentRequiredSnapshot: true,
            previousPaymentStatus: registration.paymentStatus,
            latestPayment,
            resolution,
            clearTeamId: false,
            clearExpiresAt: true,
          })
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

      updateTag(CACHE_TAGS.TOURNAMENTS)
      updateTag(CACHE_TAGS.DASHBOARD_REGISTRATIONS)
      updateTag(CACHE_TAGS.DASHBOARD_STATS)
      updateTag(CACHE_TAGS.DASHBOARD_PAYMENTS)

      return {
        success: true,
        message: !isPaidRegistration
          ? 'Votre inscription a été annulée.'
          : refundEligible
            ? 'Votre inscription a été annulée et remboursée.'
            : waiveRefund
              ? "Votre inscription a été annulée. Vos frais d'inscription ont été offerts au Belouga Tournament."
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
      await prisma.$transaction(async tx => {
        await cancelOrDeleteRegistration({
          tx,
          registrationId: registration.id,
          paymentRequiredSnapshot: isPaidRegistration,
          previousPaymentStatus: registration.paymentStatus,
          latestPayment,
          resolution,
          clearTeamId: true,
          clearExpiresAt: isPaidRegistration,
        })
      })

      // Issue Stripe refund after DB update (DB-first pattern)
      if (refundEligible && latestPayment) {
        await issueStripeRefundAfterDbUpdate({
          registrationId: registration.id,
          latestPayment,
          previousPaymentStatus: registration.paymentStatus,
          idempotencyPrefix: 'refund',
        })
      }

      updateTag(CACHE_TAGS.TOURNAMENTS)
      updateTag(CACHE_TAGS.DASHBOARD_REGISTRATIONS)
      updateTag(CACHE_TAGS.DASHBOARD_STATS)
      updateTag(CACHE_TAGS.DASHBOARD_PAYMENTS)

      return {
        success: true,
        message: !isPaidRegistration
          ? 'Votre inscription a été annulée.'
          : refundEligible
            ? 'Votre inscription a été annulée et remboursée.'
            : waiveRefund
              ? "Votre inscription a été annulée. Vos frais d'inscription ont été offerts au Belouga Tournament."
              : "Votre inscription a été annulée. Cette désinscription n'ouvre pas droit à un remboursement automatique.",
      }
    }

    const team = teamMember.team

    // Save pre-mutation state for potential Stripe revert
    const teamRevertInfo = buildTeamRevertInfo({
      team,
      joinedAt: teamMember.joinedAt,
      userId,
      tournamentId: data.tournamentId,
    })

    await prisma.$transaction(async tx => {
      // a. Remove team member record
      await tx.teamMember.deleteMany({
        where: { teamId: team.id, userId },
      })

      // b. Cancel or delete the tournament registration depending on payment history
      await cancelOrDeleteRegistration({
        tx,
        registrationId: registration.id,
        paymentRequiredSnapshot: isPaidRegistration,
        previousPaymentStatus: registration.paymentStatus,
        latestPayment,
        resolution,
        clearTeamId: true,
        clearExpiresAt: isPaidRegistration,
      })

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
        onRevert: buildTeamRevertCallback(registration.id, teamRevertInfo),
      })
    }

    updateTag(CACHE_TAGS.TOURNAMENTS)
    updateTag(CACHE_TAGS.DASHBOARD_REGISTRATIONS)
    updateTag(CACHE_TAGS.DASHBOARD_STATS)
    updateTag(CACHE_TAGS.DASHBOARD_PAYMENTS)

    return {
      success: true,
      message: !isPaidRegistration
        ? 'Votre inscription a été annulée.'
        : refundEligible
          ? 'Votre inscription a été annulée et remboursée.'
          : waiveRefund
            ? "Votre inscription a été annulée. Vos frais d'inscription ont été offerts au Belouga Tournament."
            : "Votre inscription a été annulée. Cette désinscription n'ouvre pas droit à un remboursement automatique.",
    }
  },
})
