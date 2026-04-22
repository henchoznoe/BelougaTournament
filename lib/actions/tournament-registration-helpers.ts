/**
 * File: lib/actions/tournament-registration-helpers.ts
 * Description: Private helpers shared across tournament registration actions
 *   (pre-check queries, upsert logic, Stripe checkout bootstrap).
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

'use server'

import {
  MINUTE_IN_MS,
  REGISTRATION_HOLD_MINUTES,
  SECOND_IN_MS,
} from '@/lib/config/constants'
import { env } from '@/lib/core/env'
import { logger } from '@/lib/core/logger'
import prisma from '@/lib/core/prisma'
import { getStripe } from '@/lib/core/stripe'
import type { ActionState } from '@/lib/types/actions'
import { resolveDonationAmount } from '@/lib/utils/donation'
import { cleanupExpiredPendingRegistrations } from '@/lib/utils/registration-expiry'
import { removeUserFromTeam } from '@/lib/utils/team'
import {
  type DonationType,
  type FieldType,
  PaymentProvider,
  PaymentStatus,
  type RefundPolicyType,
  RegistrationStatus,
  RegistrationType,
  type TournamentFormat,
  TournamentStatus,
} from '@/prisma/generated/prisma/enums'

// ---------------------------------------------------------------------------
// Local query result types (shared across registration action files)
// ---------------------------------------------------------------------------

/** Tournament with its dynamic fields and registration-relevant scalars. */
export type TournamentWithFields = {
  id: string
  title: string
  status: TournamentStatus
  format: TournamentFormat
  startDate: Date
  endDate: Date
  registrationOpen: Date
  registrationClose: Date
  maxTeams: number | null
  teamSize: number
  registrationType: RegistrationType
  entryFeeAmount: number | null
  entryFeeCurrency: string | null
  refundPolicyType: RefundPolicyType
  refundDeadlineDays: number | null
  donationEnabled: boolean
  donationType: DonationType | null
  donationFixedAmount: number | null
  donationMinAmount: number | null
  fields: { label: string; type: FieldType; required: boolean; order: number }[]
}

/** Registration with nested tournament (including fields). Used by updateRegistrationFields. */
export type RegistrationWithTournament = {
  id: string
  userId: string
  status: RegistrationStatus
  tournamentId: string
  tournament: TournamentWithFields
}

type ExistingRegistration = {
  id: string
  status: RegistrationStatus
  paymentStatus: PaymentStatus
  paymentRequiredSnapshot: boolean
  expiresAt: Date | null
}

/** Team with a member count. Used by joinTeamAndRegister. */
export type TeamWithMemberCount = {
  id: string
  tournamentId: string
  _count: { members: number }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Builds an absolute URL from an application-relative path. */
const buildAbsoluteAppUrl = (path: string) =>
  new URL(path, env.NEXT_PUBLIC_APP_URL).toString()

/** Creates or refreshes a pending Stripe checkout for a registration. */
export const startPaidRegistrationCheckout = async ({
  registrationId,
  tournament,
  userId,
  returnPath,
  donationAmount,
}: {
  registrationId: string
  tournament: TournamentWithFields
  userId: string
  returnPath: string
  donationAmount?: number | null
}): Promise<ActionState<{ checkoutUrl: string }>> => {
  if (
    tournament.entryFeeAmount === null ||
    tournament.entryFeeCurrency === null
  ) {
    return {
      success: false,
      message:
        "Le paiement Stripe n'est pas correctement configuré pour ce tournoi.",
    }
  }

  const donationResolution = resolveDonationAmount({
    tournament,
    donationAmount,
  })
  if (!donationResolution.valid) {
    return { success: false, message: donationResolution.message }
  }

  const existingPendingPayments = await prisma.payment.findMany({
    where: {
      registrationId,
      status: { in: [PaymentStatus.PENDING, PaymentStatus.UNPAID] },
    },
    select: {
      stripeCheckoutSessionId: true,
    },
  })

  const stripe = getStripe()
  for (const payment of existingPendingPayments) {
    if (!payment.stripeCheckoutSessionId) {
      continue
    }

    try {
      await stripe.checkout.sessions.expire(payment.stripeCheckoutSessionId)
    } catch {
      // Session may already be completed or expired; the webhook guard below
      // prevents stale successes from re-confirming cancelled attempts.
    }
  }

  const expiresAt = new Date(
    Date.now() + REGISTRATION_HOLD_MINUTES * MINUTE_IN_MS,
  )
  const entryFeeAmount = tournament.entryFeeAmount
  const resolvedDonationAmount = donationResolution.donationAmount
  const amount = entryFeeAmount + resolvedDonationAmount
  const currency = tournament.entryFeeCurrency

  let payment: { id: string }
  try {
    payment = await prisma.$transaction(async tx => {
      const currentRegistration = await tx.tournamentRegistration.findUnique({
        where: { id: registrationId },
        select: {
          id: true,
          status: true,
          paymentStatus: true,
        },
      })

      if (!currentRegistration) {
        throw new Error('REGISTRATION_NOT_FOUND')
      }

      if (
        currentRegistration.status === RegistrationStatus.CONFIRMED ||
        currentRegistration.paymentStatus === PaymentStatus.PAID
      ) {
        throw new Error('REGISTRATION_ALREADY_CONFIRMED')
      }

      await tx.payment.updateMany({
        where: {
          registrationId,
          status: { in: [PaymentStatus.PENDING, PaymentStatus.UNPAID] },
        },
        data: { status: PaymentStatus.CANCELLED },
      })

      await tx.tournamentRegistration.update({
        where: { id: registrationId },
        data: {
          status: RegistrationStatus.PENDING,
          paymentStatus: PaymentStatus.PENDING,
          paymentRequiredSnapshot: true,
          entryFeeAmountSnapshot: tournament.entryFeeAmount,
          entryFeeCurrencySnapshot: tournament.entryFeeCurrency,
          refundDeadlineDaysSnapshot: tournament.refundDeadlineDays,
          donationAmountSnapshot:
            resolvedDonationAmount > 0 ? resolvedDonationAmount : null,
          confirmedAt: null,
          cancelledAt: null,
          expiresAt,
        },
      })

      return tx.payment.create({
        data: {
          registrationId,
          provider: PaymentProvider.STRIPE,
          status: PaymentStatus.PENDING,
          amount,
          currency,
          donationAmount:
            resolvedDonationAmount > 0 ? resolvedDonationAmount : null,
        },
      })
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'REGISTRATION_NOT_FOUND') {
      return {
        success: false,
        message: 'Inscription introuvable.',
      }
    }

    if (
      error instanceof Error &&
      error.message === 'REGISTRATION_ALREADY_CONFIRMED'
    ) {
      return {
        success: false,
        message: 'Votre inscription est déjà confirmée.',
      }
    }

    throw error
  }

  try {
    const session = await stripe.checkout.sessions.create(
      {
        mode: 'payment',
        consent_collection: { terms_of_service: 'required' },
        client_reference_id: registrationId,
        success_url: buildAbsoluteAppUrl(
          `${returnPath}${returnPath.includes('?') ? '&' : '?'}stripe=success`,
        ),
        cancel_url: buildAbsoluteAppUrl(
          `${returnPath}${returnPath.includes('?') ? '&' : '?'}stripe=cancelled`,
        ),
        expires_at: Math.floor(expiresAt.getTime() / SECOND_IN_MS),
        currency: currency.toLowerCase(),
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency: currency.toLowerCase(),
              unit_amount: entryFeeAmount,
              product_data: {
                name: `Inscription - ${tournament.title ?? 'Tournoi'}`,
              },
            },
          },
          ...(resolvedDonationAmount > 0
            ? [
                {
                  quantity: 1,
                  price_data: {
                    currency: currency.toLowerCase(),
                    unit_amount: resolvedDonationAmount,
                    product_data: {
                      name: 'Don - Belouga Tournament',
                    },
                  },
                },
              ]
            : []),
        ],
        metadata: {
          paymentId: payment.id,
          registrationId,
          tournamentId: tournament.id,
          userId,
        },
        payment_intent_data: {
          metadata: {
            paymentId: payment.id,
            registrationId,
            tournamentId: tournament.id,
            userId,
          },
        },
      },
      { idempotencyKey: payment.id },
    )

    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: PaymentStatus.PENDING,
        stripeCheckoutSessionId: session.id,
        stripeCustomerId:
          typeof session.customer === 'string' ? session.customer : null,
      },
    })

    if (!session.url) {
      throw new Error('Stripe checkout session did not return a URL')
    }

    return {
      success: true,
      message: 'Redirection vers Stripe\u2026',
      data: { checkoutUrl: session.url },
    }
  } catch (error) {
    logger.error({ error }, 'Failed to create Stripe checkout session')

    await prisma.$transaction(async tx => {
      await removeUserFromTeam(tx, userId, tournament.id)

      await tx.payment.update({
        where: { id: payment.id },
        data: { status: PaymentStatus.FAILED },
      })

      await tx.tournamentRegistration.update({
        where: { id: registrationId },
        data: {
          status: RegistrationStatus.EXPIRED,
          paymentStatus: PaymentStatus.FAILED,
          teamId: null,
          expiresAt: new Date(),
        },
      })
    })

    return {
      success: false,
      message: 'Impossible de créer la session de paiement Stripe.',
    }
  }
}

/**
 * Shared pre-checks for all registration actions.
 * Verifies: user is not banned, tournament exists & PUBLISHED, registration window open,
 * no duplicate or overlapping registration.
 * Returns the tournament on success, or an ActionState error on failure.
 */
export const fetchTournamentForRegistration = async (
  userId: string,
  tournamentId: string,
): Promise<
  | { error: ActionState }
  | {
      tournament: TournamentWithFields
      existingRegistration: ExistingRegistration | null
    }
> => {
  // Step 0: Check if the user is currently banned
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { bannedAt: true, bannedUntil: true },
  })

  if (user?.bannedAt) {
    const now = new Date()
    const isBanActive = !user.bannedUntil || user.bannedUntil > now
    if (isBanActive) {
      return {
        error: {
          success: false,
          message:
            'Votre compte est suspendu. Vous ne pouvez pas vous inscrire à des tournois.',
        },
      }
    }
  }

  await cleanupExpiredPendingRegistrations(userId)

  const tournament = (await prisma.tournament.findUnique({
    where: { id: tournamentId },
    include: { fields: { orderBy: { order: 'asc' } } },
  })) as TournamentWithFields | null

  if (!tournament || tournament.status !== TournamentStatus.PUBLISHED) {
    return {
      error: {
        success: false,
        message: 'Ce tournoi est introuvable ou indisponible.',
      },
    }
  }

  const now = new Date()
  if (now < tournament.registrationOpen || now > tournament.registrationClose) {
    return {
      error: {
        success: false,
        message: 'Les inscriptions ne sont pas ouvertes.',
      },
    }
  }

  const existing = await prisma.tournamentRegistration.findUnique({
    where: { tournamentId_userId: { tournamentId, userId } },
    select: {
      id: true,
      status: true,
      paymentStatus: true,
      paymentRequiredSnapshot: true,
      expiresAt: true,
    },
  })
  if (existing?.status === RegistrationStatus.CONFIRMED) {
    return {
      error: {
        success: false,
        message: 'Vous êtes déjà inscrit à ce tournoi.',
      },
    }
  }

  const overlapping = await prisma.tournamentRegistration.findFirst({
    where: {
      userId,
      tournamentId: { not: tournamentId },
      status: {
        in: [RegistrationStatus.PENDING, RegistrationStatus.CONFIRMED],
      },
      tournament: {
        startDate: { lt: tournament.endDate },
        endDate: { gt: tournament.startDate },
      },
    },
    select: { tournament: { select: { title: true } } },
  })
  if (overlapping) {
    return {
      error: {
        success: false,
        message:
          'Vous êtes déjà inscrit à un tournoi qui se déroule pendant la même période.',
      },
    }
  }

  return {
    tournament,
    existingRegistration: existing as ExistingRegistration | null,
  }
}

/** Creates or refreshes a registration row for the next registration attempt. */
export const upsertRegistrationAttempt = async ({
  tx = prisma,
  existingRegistration,
  tournament,
  userId,
  fieldValues,
  teamId,
}: {
  tx?: Pick<typeof prisma, 'tournamentRegistration'>
  existingRegistration: ExistingRegistration | null
  tournament: TournamentWithFields
  userId: string
  fieldValues: Record<string, string | number>
  teamId?: string | null
}) => {
  const isPaid = tournament.registrationType === RegistrationType.PAID

  if (existingRegistration) {
    return tx.tournamentRegistration.update({
      where: { id: existingRegistration.id },
      data: {
        fieldValues,
        teamId,
        status: isPaid
          ? RegistrationStatus.PENDING
          : RegistrationStatus.CONFIRMED,
        paymentStatus: isPaid
          ? PaymentStatus.PENDING
          : PaymentStatus.NOT_REQUIRED,
        paymentRequiredSnapshot: isPaid,
        entryFeeAmountSnapshot: isPaid ? tournament.entryFeeAmount : null,
        entryFeeCurrencySnapshot: isPaid ? tournament.entryFeeCurrency : null,
        refundDeadlineDaysSnapshot: isPaid
          ? tournament.refundDeadlineDays
          : null,
        confirmedAt: isPaid ? null : new Date(),
        cancelledAt: null,
        expiresAt: isPaid
          ? new Date(Date.now() + REGISTRATION_HOLD_MINUTES * MINUTE_IN_MS)
          : null,
      },
    })
  }

  return tx.tournamentRegistration.create({
    data: {
      tournamentId: tournament.id,
      userId,
      fieldValues,
      teamId,
      status: isPaid
        ? RegistrationStatus.PENDING
        : RegistrationStatus.CONFIRMED,
      paymentStatus: isPaid
        ? PaymentStatus.PENDING
        : PaymentStatus.NOT_REQUIRED,
      paymentRequiredSnapshot: isPaid,
      entryFeeAmountSnapshot: isPaid ? tournament.entryFeeAmount : null,
      entryFeeCurrencySnapshot: isPaid ? tournament.entryFeeCurrency : null,
      refundDeadlineDaysSnapshot: isPaid ? tournament.refundDeadlineDays : null,
      confirmedAt: isPaid ? null : new Date(),
      expiresAt: isPaid
        ? new Date(Date.now() + REGISTRATION_HOLD_MINUTES * MINUTE_IN_MS)
        : null,
    },
  })
}
