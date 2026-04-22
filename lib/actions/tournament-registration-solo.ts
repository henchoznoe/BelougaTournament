/**
 * File: lib/actions/tournament-registration-solo.ts
 * Description: Server actions for solo tournament registration:
 *   register, update field values, and cancel a pending checkout.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

'use server'

import { updateTag } from 'next/cache'
import { authenticatedAction } from '@/lib/actions/safe-action'
import {
  fetchTournamentForRegistration,
  type RegistrationWithTournament,
  startPaidRegistrationCheckout,
  type TournamentWithFields,
  upsertRegistrationAttempt,
} from '@/lib/actions/tournament-registration-helpers'
import { CACHE_TAGS } from '@/lib/config/constants'
import prisma from '@/lib/core/prisma'
import { getStripe } from '@/lib/core/stripe'
import type { ActionState } from '@/lib/types/actions'
import { removeUserFromTeam } from '@/lib/utils/team'
import { validateFieldValues } from '@/lib/utils/tournament-helpers'
import {
  cancelPendingRegistrationSchema,
  registerForTournamentSchema,
  updateRegistrationFieldsSchema,
} from '@/lib/validations/tournaments'
import {
  PaymentStatus,
  RegistrationStatus,
  RegistrationType,
  TournamentFormat,
  TournamentStatus,
} from '@/prisma/generated/prisma/enums'

/** Updates a user's own registration field values. */
export const updateRegistrationFields = authenticatedAction({
  schema: updateRegistrationFieldsSchema,
  handler: async (data, session): Promise<ActionState> => {
    const registration = (await prisma.tournamentRegistration.findUnique({
      where: { id: data.registrationId },
      include: {
        tournament: { include: { fields: { orderBy: { order: 'asc' } } } },
      },
    })) as RegistrationWithTournament | null

    if (!registration) {
      return { success: false, message: 'Inscription introuvable.' }
    }

    if (registration.userId !== session.user.id) {
      return {
        success: false,
        message: "Vous ne pouvez pas modifier l'inscription d'un autre joueur.",
      }
    }

    if (registration.tournamentId !== data.tournamentId) {
      return { success: false, message: 'ID de tournoi invalide.' }
    }

    if (
      registration.status !== RegistrationStatus.PENDING &&
      registration.status !== RegistrationStatus.CONFIRMED
    ) {
      return {
        success: false,
        message: 'Cette inscription ne peut plus être modifiée.',
      }
    }

    if (registration.tournament.status !== TournamentStatus.PUBLISHED) {
      return {
        success: false,
        message: 'Ce tournoi est introuvable ou indisponible.',
      }
    }

    if (new Date() > registration.tournament.registrationClose) {
      return {
        success: false,
        message:
          'Les inscriptions sont fermées. Vous ne pouvez plus modifier vos informations.',
      }
    }

    const tournament: TournamentWithFields = registration.tournament
    const fieldValidation = validateFieldValues(
      tournament.fields,
      data.fieldValues,
    )
    if (!fieldValidation.valid) {
      return { success: false, message: fieldValidation.message }
    }

    await prisma.tournamentRegistration.update({
      where: { id: data.registrationId },
      data: { fieldValues: data.fieldValues },
    })

    updateTag(CACHE_TAGS.TOURNAMENTS)
    updateTag(CACHE_TAGS.DASHBOARD_REGISTRATIONS)

    return { success: true, message: 'Votre inscription a été mise à jour.' }
  },
})

/** Registers the current user for a tournament (solo format). */
export const registerForTournament = authenticatedAction({
  schema: registerForTournamentSchema,
  handler: async (
    data,
    session,
  ): Promise<ActionState<{ checkoutUrl: string }>> => {
    const result = await fetchTournamentForRegistration(
      session.user.id,
      data.tournamentId,
    )
    if ('error' in result)
      return result.error as ActionState<{ checkoutUrl: string }>
    const { tournament, existingRegistration } = result

    if (tournament.format === TournamentFormat.TEAM) {
      return {
        success: false,
        message:
          'Ce tournoi est en format équipe. Utilisez le formulaire équipe.',
      }
    }

    const validation = validateFieldValues(tournament.fields, data.fieldValues)
    if (!validation.valid) {
      return { success: false, message: validation.message }
    }

    let registration: Awaited<ReturnType<typeof upsertRegistrationAttempt>>
    try {
      registration = await prisma.$transaction(async tx => {
        if (tournament.maxTeams !== null) {
          const count = await tx.tournamentRegistration.count({
            where: {
              tournamentId: data.tournamentId,
              status: {
                in: [RegistrationStatus.PENDING, RegistrationStatus.CONFIRMED],
              },
              ...(existingRegistration
                ? { id: { not: existingRegistration.id } }
                : {}),
            },
          })
          if (count >= tournament.maxTeams) {
            throw new Error('TOURNAMENT_FULL')
          }
        }

        return upsertRegistrationAttempt({
          tx,
          existingRegistration,
          tournament,
          userId: session.user.id,
          fieldValues: data.fieldValues,
          teamId: null,
        })
      })
    } catch (error) {
      if (error instanceof Error && error.message === 'TOURNAMENT_FULL') {
        return { success: false, message: 'Le tournoi est complet.' }
      }
      throw error
    }

    if (tournament.registrationType === RegistrationType.PAID) {
      return startPaidRegistrationCheckout({
        registrationId: registration.id,
        tournament,
        userId: session.user.id,
        returnPath: data.returnPath,
        donationAmount: data.donationAmount,
      })
    }

    updateTag(CACHE_TAGS.TOURNAMENTS)
    updateTag(CACHE_TAGS.DASHBOARD_REGISTRATIONS)
    updateTag(CACHE_TAGS.DASHBOARD_STATS)

    return { success: true, message: 'Votre inscription a été enregistrée.' }
  },
})

/**
 * Cancels a PENDING (unpaid) registration for the current user.
 * Called when the user returns from Stripe with ?stripe=cancelled.
 * Expires the Stripe checkout session (if still active), removes the user from
 * any team, then marks the payment as CANCELLED and the registration as EXPIRED.
 * Idempotent: silently succeeds when no PENDING registration is found.
 */
export const cancelMyPendingRegistrationForTournament = authenticatedAction({
  schema: cancelPendingRegistrationSchema,
  handler: async (data, session): Promise<ActionState> => {
    const userId = session.user.id

    const registration = await prisma.tournamentRegistration.findUnique({
      where: {
        tournamentId_userId: { tournamentId: data.tournamentId, userId },
      },
      select: { id: true, status: true, teamId: true },
    })

    if (!registration || registration.status !== RegistrationStatus.PENDING) {
      return { success: true, message: 'Aucune inscription en attente.' }
    }

    const pendingPayment = await prisma.payment.findFirst({
      where: { registrationId: registration.id, status: PaymentStatus.PENDING },
      orderBy: { createdAt: 'desc' },
      select: { id: true, stripeCheckoutSessionId: true },
    })

    // Expire the Stripe checkout session if still active (best-effort)
    if (pendingPayment?.stripeCheckoutSessionId) {
      try {
        const stripe = getStripe()
        await stripe.checkout.sessions.expire(
          pendingPayment.stripeCheckoutSessionId,
        )
      } catch {
        // Session may already be expired or completed; non-fatal
      }
    }

    await prisma.$transaction(async tx => {
      await removeUserFromTeam(tx, userId, data.tournamentId)

      if (pendingPayment) {
        await tx.payment.update({
          where: { id: pendingPayment.id },
          data: { status: PaymentStatus.CANCELLED },
        })
      }

      await tx.tournamentRegistration.update({
        where: { id: registration.id },
        data: {
          status: RegistrationStatus.EXPIRED,
          paymentStatus: PaymentStatus.CANCELLED,
          expiresAt: new Date(),
        },
      })
    })

    updateTag(CACHE_TAGS.TOURNAMENTS)
    updateTag(CACHE_TAGS.DASHBOARD_REGISTRATIONS)
    updateTag(CACHE_TAGS.DASHBOARD_STATS)

    return { success: true, message: 'Inscription annulée.' }
  },
})
