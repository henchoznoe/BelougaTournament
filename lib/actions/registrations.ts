/**
 * File: lib/actions/registrations.ts
 * Description: Server actions for admin registration management (delete, update fields, refund).
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
import type { TeamRevertInfo } from '@/lib/utils/team'
import {
  buildTeamRevertCallback,
  handleCaptainSuccession,
} from '@/lib/utils/team'
import { validateFieldValues } from '@/lib/utils/tournament-helpers'
import {
  adminUpdateRegistrationFieldsSchema,
  deleteRegistrationSchema,
  refundRegistrationSchema,
} from '@/lib/validations/registrations'
import {
  PaymentStatus,
  RegistrationStatus,
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

    // 2. SOLO format — just delete the registration
    if (registration.tournament.format === TournamentFormat.SOLO) {
      if (registration.paymentRequiredSnapshot) {
        await prisma.tournamentRegistration.update({
          where: { id: registration.id },
          data: {
            status: RegistrationStatus.CANCELLED,
            paymentStatus: registration.paymentStatus,
            cancelledAt: new Date(),
            teamId: null,
          },
        })
      } else {
        await prisma.tournamentRegistration.delete({
          where: { id: registration.id },
        })
      }

      revalidateTag(CACHE_TAGS.TOURNAMENTS, 'hours')
      revalidateTag(CACHE_TAGS.DASHBOARD_REGISTRATIONS, 'minutes')
      revalidateTag(CACHE_TAGS.DASHBOARD_STATS, 'minutes')

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
      if (registration.paymentRequiredSnapshot) {
        await prisma.tournamentRegistration.update({
          where: { id: registration.id },
          data: {
            status: RegistrationStatus.CANCELLED,
            paymentStatus: registration.paymentStatus,
            cancelledAt: new Date(),
            teamId: null,
          },
        })
      } else {
        await prisma.tournamentRegistration.delete({
          where: { id: registration.id },
        })
      }

      revalidateTag(CACHE_TAGS.TOURNAMENTS, 'hours')
      revalidateTag(CACHE_TAGS.DASHBOARD_REGISTRATIONS, 'minutes')
      revalidateTag(CACHE_TAGS.DASHBOARD_STATS, 'minutes')

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
      if (registration.paymentRequiredSnapshot) {
        await tx.tournamentRegistration.update({
          where: { id: registration.id },
          data: {
            status: RegistrationStatus.CANCELLED,
            paymentStatus: registration.paymentStatus,
            cancelledAt: new Date(),
            teamId: null,
          },
        })
      } else {
        await tx.tournamentRegistration.delete({
          where: { id: registration.id },
        })
      }

      // c. Handle captain succession / team cleanup
      await handleCaptainSuccession(tx, team, registration.userId)
    })

    revalidateTag(CACHE_TAGS.TOURNAMENTS, 'hours')
    revalidateTag(CACHE_TAGS.DASHBOARD_REGISTRATIONS, 'minutes')
    revalidateTag(CACHE_TAGS.DASHBOARD_STATS, 'minutes')

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

    revalidateTag(CACHE_TAGS.TOURNAMENTS, 'hours')

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

    // DB-first pattern: update DB to REFUNDED state before calling Stripe
    // Track team state for potential Stripe revert (TEAM format only)
    let teamRevertInfo: TeamRevertInfo | null = null

    if (registration.tournament.format === TournamentFormat.SOLO) {
      await prisma.$transaction(async tx => {
        await tx.payment.update({
          where: { id: latestPayment.id },
          data: {
            status: PaymentStatus.REFUNDED,
            refundAmount: latestPayment.amount,
            refundedAt: new Date(),
          },
        })

        await tx.tournamentRegistration.update({
          where: { id: registration.id },
          data: {
            status: RegistrationStatus.CANCELLED,
            paymentStatus: PaymentStatus.REFUNDED,
            cancelledAt: new Date(),
            teamId: null,
          },
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
          await tx.payment.update({
            where: { id: latestPayment.id },
            data: {
              status: PaymentStatus.REFUNDED,
              refundAmount: latestPayment.amount,
              refundedAt: new Date(),
            },
          })

          await tx.tournamentRegistration.update({
            where: { id: registration.id },
            data: {
              status: RegistrationStatus.CANCELLED,
              paymentStatus: PaymentStatus.REFUNDED,
              cancelledAt: new Date(),
              teamId: null,
            },
          })
        })
      } else {
        const team = teamMember.team

        // Save pre-mutation state for potential Stripe revert
        teamRevertInfo = {
          teamId: team.id,
          userId: registration.userId,
          joinedAt: teamMember.joinedAt,
          captainId: team.captainId,
          isFull: team.isFull,
          teamWasDeleted: team.members.length === 1,
          tournamentId: registration.tournament.id,
          teamName: team.name,
        }

        await prisma.$transaction(async tx => {
          await tx.teamMember.deleteMany({
            where: { teamId: team.id, userId: registration.userId },
          })

          await tx.payment.update({
            where: { id: latestPayment.id },
            data: {
              status: PaymentStatus.REFUNDED,
              refundAmount: latestPayment.amount,
              refundedAt: new Date(),
            },
          })

          await tx.tournamentRegistration.update({
            where: { id: registration.id },
            data: {
              status: RegistrationStatus.CANCELLED,
              paymentStatus: PaymentStatus.REFUNDED,
              cancelledAt: new Date(),
              teamId: null,
            },
          })

          await handleCaptainSuccession(tx, team, registration.userId)
        })
      }
    }

    // Issue Stripe refund after DB update; revert DB on failure
    await issueStripeRefundAfterDbUpdate({
      registrationId: registration.id,
      latestPayment,
      previousPaymentStatus: PaymentStatus.PAID,
      idempotencyPrefix: 'admin-refund',
      onRevert: teamRevertInfo
        ? buildTeamRevertCallback(registration.id, teamRevertInfo)
        : undefined,
    })

    revalidateTag(CACHE_TAGS.TOURNAMENTS, 'hours')
    revalidateTag(CACHE_TAGS.DASHBOARD_REGISTRATIONS, 'minutes')
    revalidateTag(CACHE_TAGS.DASHBOARD_STATS, 'minutes')
    revalidateTag(CACHE_TAGS.DASHBOARD_PAYMENTS, 'minutes')

    return {
      success: true,
      message: `L'inscription de ${registration.user.name} a été remboursée.`,
    }
  },
})
