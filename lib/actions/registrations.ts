/**
 * File: lib/actions/registrations.ts
 * Description: Server actions for admin registration management (delete, update fields, refund).
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

'use server'

import { updateTag } from 'next/cache'
import { cancelOrDeleteRegistration } from '@/lib/actions/registration-cancellation'
import { authenticatedAction } from '@/lib/actions/safe-action'
import { CACHE_TAGS } from '@/lib/config/constants'
import { logger } from '@/lib/core/logger'
import prisma from '@/lib/core/prisma'
import type { ActionState } from '@/lib/types/actions'
import type { TeamMemberWithTeam } from '@/lib/types/team'
import { refundPaymentViaStripe } from '@/lib/utils/stripe-refund'
import { handleCaptainSuccession } from '@/lib/utils/team'
import { validateFieldValues } from '@/lib/utils/tournament-helpers'
import {
  adminUpdateRegistrationFieldsSchema,
  deleteRegistrationSchema,
  refundRegistrationSchema,
} from '@/lib/validations/registrations'
import {
  PaymentStatus,
  Role,
  TournamentFormat,
} from '@/prisma/generated/prisma/enums'

/** Registration with tournament info. Used by adminDeleteRegistration. */
type RegistrationWithDetails = {
  id: string
  userId: string
  paymentRequiredSnapshot: boolean
  paymentStatus: PaymentStatus
  payments: {
    id: string
    status: PaymentStatus
    amount: number
    stripeFee: number | null
    donationAmount: number | null
    stripePaymentIntentId: string | null
    stripeChargeId: string | null
  }[]
  tournament: { id: string; format: TournamentFormat }
  user: { name: string }
}

/** Forces deletion of a registration. */
export const adminDeleteRegistration = authenticatedAction({
  schema: deleteRegistrationSchema,
  role: Role.ADMIN,
  handler: async (data): Promise<ActionState> => {
    // 1. Fetch registration with tournament + user info
    const registration = (await prisma.tournamentRegistration.findUnique({
      where: { id: data.registrationId },
      include: {
        payments: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        tournament: { select: { id: true, format: true } },
        user: { select: { name: true } },
      },
    })) as RegistrationWithDetails | null

    if (!registration) {
      return { success: false, message: 'Inscription introuvable.' }
    }

    const latestPayment = registration.payments[0] ?? null
    // A force-delete never refunds. When the fee was actually paid, keep the money
    // but record it as FORFEITED so the payment never lingers in a misleading PAID
    // state on a CANCELLED registration. Otherwise leave the payment untouched.
    const deleteResolution =
      registration.paymentStatus === PaymentStatus.PAID ? 'forfeit' : 'cancel'

    // 2. SOLO format — just delete the registration
    if (registration.tournament.format === TournamentFormat.SOLO) {
      await prisma.$transaction(async tx => {
        await cancelOrDeleteRegistration({
          tx,
          registrationId: registration.id,
          paymentRequiredSnapshot: registration.paymentRequiredSnapshot,
          previousPaymentStatus: registration.paymentStatus,
          latestPayment,
          resolution: deleteResolution,
        })
      })

      updateTag(CACHE_TAGS.TOURNAMENTS)
      updateTag(CACHE_TAGS.DASHBOARD_REGISTRATIONS)
      updateTag(CACHE_TAGS.DASHBOARD_STATS)
      updateTag(CACHE_TAGS.DASHBOARD_PAYMENTS)

      return {
        success: true,
        message: `L'inscription de ${registration.user.name} a été supprimée.`,
      }
    }

    // 3. TEAM format — find team membership
    const teamMember = (await prisma.teamMember.findFirst({
      where: {
        userId: registration.userId,
        team: { tournamentId: registration.tournament.id },
      },
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
      // Edge case: registration exists but no team membership — clean up
      await prisma.$transaction(async tx => {
        await cancelOrDeleteRegistration({
          tx,
          registrationId: registration.id,
          paymentRequiredSnapshot: registration.paymentRequiredSnapshot,
          previousPaymentStatus: registration.paymentStatus,
          latestPayment,
          resolution: deleteResolution,
        })
      })

      updateTag(CACHE_TAGS.TOURNAMENTS)
      updateTag(CACHE_TAGS.DASHBOARD_REGISTRATIONS)
      updateTag(CACHE_TAGS.DASHBOARD_STATS)
      updateTag(CACHE_TAGS.DASHBOARD_PAYMENTS)

      return {
        success: true,
        message: `L'inscription de ${registration.user.name} a été supprimée.`,
      }
    }

    const team = teamMember.team

    await prisma.$transaction(async tx => {
      // a. Remove team member record
      await tx.teamMember.deleteMany({
        where: { teamId: team.id, userId: registration.userId },
      })

      // b. Remove or cancel tournament registration depending on payment history
      await cancelOrDeleteRegistration({
        tx,
        registrationId: registration.id,
        paymentRequiredSnapshot: registration.paymentRequiredSnapshot,
        previousPaymentStatus: registration.paymentStatus,
        latestPayment,
        resolution: deleteResolution,
      })

      // c. Handle captain succession / team cleanup
      await handleCaptainSuccession(tx, team, registration.userId)
    })

    updateTag(CACHE_TAGS.TOURNAMENTS)
    updateTag(CACHE_TAGS.DASHBOARD_REGISTRATIONS)
    updateTag(CACHE_TAGS.DASHBOARD_STATS)
    updateTag(CACHE_TAGS.DASHBOARD_PAYMENTS)

    return {
      success: true,
      message: `L'inscription de ${registration.user.name} a été supprimée.`,
    }
  },
})

// ---------------------------------------------------------------------------
// adminUpdateRegistrationFields
// ---------------------------------------------------------------------------

/** Registration with tournament fields. Used by adminUpdateRegistrationFields. */
type RegistrationWithFields = {
  id: string
  tournament: {
    id: string
    fields: { label: string; type: string; required: boolean }[]
  }
  user: { name: string }
}

/** Updates the custom field values (fieldValues JSON) on a registration. */
export const adminUpdateRegistrationFields = authenticatedAction({
  schema: adminUpdateRegistrationFieldsSchema,
  role: Role.ADMIN,
  handler: async (data): Promise<ActionState> => {
    const registration = (await prisma.tournamentRegistration.findUnique({
      where: { id: data.registrationId },
      include: {
        tournament: {
          select: {
            id: true,
            fields: {
              orderBy: { order: 'asc' },
              select: { label: true, type: true, required: true },
            },
          },
        },
        user: { select: { name: true } },
      },
    })) as RegistrationWithFields | null

    if (!registration) {
      return { success: false, message: 'Inscription introuvable.' }
    }

    const fieldValidation = validateFieldValues(
      registration.tournament.fields,
      data.fieldValues,
    )
    if (!fieldValidation.valid) {
      return { success: false, message: fieldValidation.message }
    }

    await prisma.tournamentRegistration.update({
      where: { id: registration.id },
      data: { fieldValues: data.fieldValues },
    })

    updateTag(CACHE_TAGS.TOURNAMENTS)

    return {
      success: true,
      message: `Les champs de ${registration.user.name} ont été mis à jour.`,
    }
  },
})

/** Refunds a paid registration manually and cancels the player's registration. */
export const adminRefundRegistration = authenticatedAction({
  schema: refundRegistrationSchema,
  role: Role.ADMIN,
  handler: async (data): Promise<ActionState> => {
    const registration = (await prisma.tournamentRegistration.findUnique({
      where: { id: data.registrationId },
      include: {
        payments: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        tournament: { select: { id: true, format: true } },
        user: { select: { name: true } },
      },
    })) as RegistrationWithDetails | null

    if (!registration) {
      return { success: false, message: 'Inscription introuvable.' }
    }

    if (
      !registration.paymentRequiredSnapshot ||
      registration.paymentStatus !== PaymentStatus.PAID
    ) {
      return {
        success: false,
        message: 'Cette inscription ne peut pas être remboursée.',
      }
    }

    const latestPayment = registration.payments[0]

    if (!latestPayment) {
      return {
        success: false,
        message: 'Aucun paiement Stripe associé à cette inscription.',
      }
    }

    if (!latestPayment.stripePaymentIntentId && !latestPayment.stripeChargeId) {
      return {
        success: false,
        message:
          'Aucune référence Stripe (PaymentIntent ou Charge) trouvée pour ce paiement.',
      }
    }

    // Stripe-first: issue the refund before mutating the DB. If Stripe fails, the
    // registration is left untouched (no money moved, no false "refunded" state).
    let refundResult: { stripeRefundId: string; refundAmount: number }
    try {
      refundResult = await refundPaymentViaStripe({
        payment: latestPayment,
        registrationId: registration.id,
        idempotencyPrefix: 'admin-refund',
      })
    } catch (error) {
      logger.error(
        { error, registrationId: registration.id },
        'Stripe refund failed during admin refund',
      )
      return {
        success: false,
        message:
          "Le remboursement Stripe a échoué. L'inscription est conservée.",
      }
    }

    if (registration.tournament.format === TournamentFormat.SOLO) {
      await prisma.$transaction(async tx => {
        await cancelOrDeleteRegistration({
          tx,
          registrationId: registration.id,
          paymentRequiredSnapshot: true,
          previousPaymentStatus: PaymentStatus.PAID,
          latestPayment,
          resolution: 'refund',
          clearTeamId: true,
          refundIncludesDonation: true,
          refundAmount: refundResult.refundAmount,
          stripeRefundId: refundResult.stripeRefundId,
        })
      })
    } else {
      const teamMember = (await prisma.teamMember.findFirst({
        where: {
          userId: registration.userId,
          team: { tournamentId: registration.tournament.id },
        },
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
        await prisma.$transaction(async tx => {
          await cancelOrDeleteRegistration({
            tx,
            registrationId: registration.id,
            paymentRequiredSnapshot: true,
            previousPaymentStatus: PaymentStatus.PAID,
            latestPayment,
            resolution: 'refund',
            clearTeamId: true,
            refundIncludesDonation: true,
            refundAmount: refundResult.refundAmount,
            stripeRefundId: refundResult.stripeRefundId,
          })
        })
      } else {
        const team = teamMember.team

        await prisma.$transaction(async tx => {
          await tx.teamMember.deleteMany({
            where: { teamId: team.id, userId: registration.userId },
          })

          await cancelOrDeleteRegistration({
            tx,
            registrationId: registration.id,
            paymentRequiredSnapshot: true,
            previousPaymentStatus: PaymentStatus.PAID,
            latestPayment,
            resolution: 'refund',
            clearTeamId: true,
            refundIncludesDonation: true,
            refundAmount: refundResult.refundAmount,
            stripeRefundId: refundResult.stripeRefundId,
          })

          await handleCaptainSuccession(tx, team, registration.userId)
        })
      }
    }

    updateTag(CACHE_TAGS.TOURNAMENTS)
    updateTag(CACHE_TAGS.DASHBOARD_REGISTRATIONS)
    updateTag(CACHE_TAGS.DASHBOARD_STATS)
    updateTag(CACHE_TAGS.DASHBOARD_PAYMENTS)

    return {
      success: true,
      message: `L'inscription de ${registration.user.name} a été remboursée.`,
    }
  },
})
