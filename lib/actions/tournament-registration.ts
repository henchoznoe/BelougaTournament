/**
 * File: lib/actions/tournament-registration.ts
 * Description: Server actions for public tournament registration (solo + team).
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

'use server'

import { updateTag } from 'next/cache'
import { authenticatedAction } from '@/lib/actions/safe-action'
import {
  CACHE_TAGS,
  MINUTE_IN_MS,
  REGISTRATION_HOLD_MINUTES,
  SECOND_IN_MS,
} from '@/lib/config/constants'
import { env } from '@/lib/core/env'
import { logger } from '@/lib/core/logger'
import prisma from '@/lib/core/prisma'
import { getStripe } from '@/lib/core/stripe'
import type { ActionState } from '@/lib/types/actions'
import { removeUserFromTeam, syncTeamFullState } from '@/lib/utils/team'
import { validateFieldValues } from '@/lib/utils/tournament-helpers'
import {
  cancelPendingRegistrationSchema,
  createTeamSchema,
  joinTeamSchema,
  registerForTournamentSchema,
  updateRegistrationFieldsSchema,
} from '@/lib/validations/tournaments'
import {
  type FieldType,
  PaymentProvider,
  PaymentStatus,
  type RefundPolicyType,
  RegistrationStatus,
  RegistrationType,
  TournamentFormat,
  TournamentStatus,
} from '@/prisma/generated/prisma/enums'

// ---------------------------------------------------------------------------
// Local query result types
// ---------------------------------------------------------------------------

/** Tournament with its dynamic fields and registration-relevant scalars. */
type TournamentWithFields = {
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
  fields: { label: string; type: FieldType; required: boolean; order: number }[]
}

/** Registration with nested tournament (including fields). Used by updateRegistrationFields. */
type RegistrationWithTournament = {
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
type TeamWithMemberCount = {
  id: string
  tournamentId: string
  _count: { members: number }
}

// ---------------------------------------------------------------------------
// Private helpers
// ---------------------------------------------------------------------------

/** Builds an absolute URL from an application-relative path. */
const buildAbsoluteAppUrl = (path: string) => {
  return new URL(path, env.NEXT_PUBLIC_APP_URL).toString()
}

/** Creates or refreshes a pending Stripe checkout for a registration. */
const startPaidRegistrationCheckout = async ({
  registrationId,
  tournament,
  userId,
  returnPath,
}: {
  registrationId: string
  tournament: TournamentWithFields
  userId: string
  returnPath: string
}): Promise<ActionState<{ checkoutUrl: string }>> => {
  if (
    tournament.entryFeeAmount === null ||
    tournament.entryFeeCurrency === null
  ) {
    return {
      success: false,
      message:
        'Le paiement Stripe n\u2019est pas correctement configuré pour ce tournoi.',
    }
  }

  const expiresAt = new Date(
    Date.now() + REGISTRATION_HOLD_MINUTES * MINUTE_IN_MS,
  )
  const amount = tournament.entryFeeAmount
  const currency = tournament.entryFeeCurrency

  const payment = await prisma.$transaction(async tx => {
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
      },
    })
  })

  try {
    const stripe = getStripe()
    const session = await stripe.checkout.sessions.create(
      {
        mode: 'payment',
        consent_collection: {
          terms_of_service: 'required',
        },
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
              unit_amount: amount,
              product_data: {
                name: `Inscription - ${tournament.title ?? 'Tournoi'}`,
              },
            },
          },
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
      {
        idempotencyKey: payment.id,
      },
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
      message: 'Redirection vers Stripe…',
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
 * Verifies: tournament exists & PUBLISHED, registration window open, no duplicate registration.
 * Returns the tournament on success, or an ActionState error on failure.
 */
const fetchTournamentForRegistration = async (
  userId: string,
  tournamentId: string,
): Promise<
  | { error: ActionState }
  | {
      tournament: TournamentWithFields
      existingRegistration: ExistingRegistration | null
    }
> => {
  // 1. Fetch tournament with fields
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

  // 2. Check registration window
  const now = new Date()
  if (now < tournament.registrationOpen || now > tournament.registrationClose) {
    return {
      error: {
        success: false,
        message: 'Les inscriptions ne sont pas ouvertes.',
      },
    }
  }

  // 3. Load any existing registration for reuse or duplicate detection
  const existing = await prisma.tournamentRegistration.findUnique({
    where: {
      tournamentId_userId: { tournamentId, userId },
    },
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

  // 4. Check for overlapping tournament registrations
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
const upsertRegistrationAttempt = async ({
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

// ---------------------------------------------------------------------------
// Public registration actions
// ---------------------------------------------------------------------------

/** Updates a user's own registration field values. */
export const updateRegistrationFields = authenticatedAction({
  schema: updateRegistrationFieldsSchema,
  handler: async (data, session): Promise<ActionState> => {
    // 1. Fetch existing registration and verify ownership
    const registration = (await prisma.tournamentRegistration.findUnique({
      where: { id: data.registrationId },
      include: {
        tournament: {
          include: { fields: { orderBy: { order: 'asc' } } },
        },
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

    // Check registration is still active
    if (
      registration.status !== RegistrationStatus.PENDING &&
      registration.status !== RegistrationStatus.CONFIRMED
    ) {
      return {
        success: false,
        message: 'Cette inscription ne peut plus être modifiée.',
      }
    }

    // 2. Check tournament is still PUBLISHED
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

    // 3. Validate dynamic field values
    const tournament: TournamentWithFields = registration.tournament
    const fieldValidation = validateFieldValues(
      tournament.fields,
      data.fieldValues,
    )
    if (!fieldValidation.valid) {
      return { success: false, message: fieldValidation.message }
    }

    // 4. Update field values
    await prisma.tournamentRegistration.update({
      where: { id: data.registrationId },
      data: {
        fieldValues: data.fieldValues,
      },
    })

    updateTag(CACHE_TAGS.TOURNAMENTS)
    updateTag(CACHE_TAGS.DASHBOARD_REGISTRATIONS)

    return {
      success: true,
      message: 'Votre inscription a été mise à jour.',
    }
  },
})

/** Registers the current user for a tournament (solo format). */
export const registerForTournament = authenticatedAction({
  schema: registerForTournamentSchema,
  handler: async (
    data,
    session,
  ): Promise<ActionState<{ checkoutUrl: string }>> => {
    // 1. Shared pre-checks (ban, tournament, window, duplicate)
    const result = await fetchTournamentForRegistration(
      session.user.id,
      data.tournamentId,
    )
    if ('error' in result)
      return result.error as ActionState<{ checkoutUrl: string }>
    const { tournament, existingRegistration } = result

    // 2. Reject TEAM format — use createTeamAndRegister or joinTeamAndRegister instead
    if (tournament.format === TournamentFormat.TEAM) {
      return {
        success: false,
        message:
          'Ce tournoi est en format équipe. Utilisez le formulaire équipe.',
      }
    }

    // 3. Validate dynamic field values
    const validation = validateFieldValues(tournament.fields, data.fieldValues)
    if (!validation.valid) {
      return { success: false, message: validation.message }
    }

    // 4. Check maxTeams limit + upsert inside a transaction to prevent race conditions
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
      })
    }

    updateTag(CACHE_TAGS.TOURNAMENTS)
    updateTag(CACHE_TAGS.DASHBOARD_REGISTRATIONS)
    updateTag(CACHE_TAGS.DASHBOARD_STATS)

    return {
      success: true,
      message: 'Votre inscription a été enregistrée.',
    }
  },
})

// ---------------------------------------------------------------------------
// Team registration (public)
// ---------------------------------------------------------------------------

/** Creates a team and registers the current user as captain. */
export const createTeamAndRegister = authenticatedAction({
  schema: createTeamSchema,
  handler: async (
    data,
    session,
  ): Promise<ActionState<{ checkoutUrl: string }>> => {
    // 1. Shared pre-checks (ban, tournament, window, duplicate)
    const result = await fetchTournamentForRegistration(
      session.user.id,
      data.tournamentId,
    )
    if ('error' in result)
      return result.error as ActionState<{ checkoutUrl: string }>
    const { tournament, existingRegistration } = result

    // 2. Reject SOLO format
    if (tournament.format !== TournamentFormat.TEAM) {
      return {
        success: false,
        message: 'Ce tournoi est en format solo. Utilisez le formulaire solo.',
      }
    }

    // 3. Validate dynamic field values
    const validation = validateFieldValues(tournament.fields, data.fieldValues)
    if (!validation.valid) {
      return { success: false, message: validation.message }
    }

    let registration: Awaited<ReturnType<typeof upsertRegistrationAttempt>>
    try {
      registration = await prisma.$transaction(async tx => {
        // Check maxTeams limit inside transaction to prevent race conditions
        if (tournament.maxTeams !== null) {
          const teamCount = await tx.team.count({
            where: { tournamentId: data.tournamentId },
          })
          if (teamCount >= tournament.maxTeams) {
            throw new Error('MAX_TEAMS_REACHED')
          }
        }

        await removeUserFromTeam(tx, session.user.id, data.tournamentId)

        const team = await tx.team.create({
          data: {
            name: data.teamName,
            captainId: session.user.id,
            tournamentId: data.tournamentId,
            isFull: false,
          },
        })

        await tx.teamMember.create({
          data: {
            teamId: team.id,
            userId: session.user.id,
          },
        })

        const registration = await upsertRegistrationAttempt({
          tx,
          existingRegistration,
          tournament,
          userId: session.user.id,
          fieldValues: data.fieldValues,
          teamId: team.id,
        })

        await syncTeamFullState(tx, team.id, tournament.teamSize)

        return registration
      })
    } catch (error) {
      if (error instanceof Error && error.message === 'MAX_TEAMS_REACHED') {
        return {
          success: false,
          message: "Le nombre maximum d'équipes est atteint.",
        }
      }
      throw error
    }

    if (tournament.registrationType === RegistrationType.PAID) {
      return startPaidRegistrationCheckout({
        registrationId: registration.id,
        tournament,
        userId: session.user.id,
        returnPath: data.returnPath,
      })
    }

    updateTag(CACHE_TAGS.TOURNAMENTS)
    updateTag(CACHE_TAGS.DASHBOARD_REGISTRATIONS)
    updateTag(CACHE_TAGS.DASHBOARD_STATS)

    return {
      success: true,
      message: 'Votre équipe a été créée et votre inscription enregistrée.',
    }
  },
})

/** Joins an existing team and registers the current user. */
export const joinTeamAndRegister = authenticatedAction({
  schema: joinTeamSchema,
  handler: async (
    data,
    session,
  ): Promise<ActionState<{ checkoutUrl: string }>> => {
    // 1. Shared pre-checks (ban, tournament, window, duplicate)
    const result = await fetchTournamentForRegistration(
      session.user.id,
      data.tournamentId,
    )
    if ('error' in result)
      return result.error as ActionState<{ checkoutUrl: string }>
    const { tournament, existingRegistration } = result

    // 2. Reject SOLO format
    if (tournament.format !== TournamentFormat.TEAM) {
      return {
        success: false,
        message: 'Ce tournoi est en format solo. Utilisez le formulaire solo.',
      }
    }

    // 3. Fetch team and verify it belongs to the tournament
    const team = (await prisma.team.findUnique({
      where: { id: data.teamId },
      include: { _count: { select: { members: true } } },
    })) as TeamWithMemberCount | null

    if (!team || team.tournamentId !== data.tournamentId) {
      return { success: false, message: 'Équipe introuvable.' }
    }

    // 4. Validate dynamic field values
    const validation = validateFieldValues(tournament.fields, data.fieldValues)
    if (!validation.valid) {
      return { success: false, message: validation.message }
    }

    let registration: Awaited<ReturnType<typeof upsertRegistrationAttempt>>
    try {
      registration = await prisma.$transaction(async tx => {
        // Re-check team capacity inside transaction to prevent race conditions
        const freshTeam = await tx.team.findUnique({
          where: { id: data.teamId },
          include: { _count: { select: { members: true } } },
        })
        if (!freshTeam || freshTeam._count.members >= tournament.teamSize) {
          throw new Error('TEAM_FULL')
        }

        await removeUserFromTeam(tx, session.user.id, data.tournamentId)

        await tx.teamMember.create({
          data: {
            teamId: data.teamId,
            userId: session.user.id,
          },
        })

        const registration = await upsertRegistrationAttempt({
          tx,
          existingRegistration,
          tournament,
          userId: session.user.id,
          fieldValues: data.fieldValues,
          teamId: data.teamId,
        })

        await syncTeamFullState(tx, data.teamId, tournament.teamSize)

        return registration
      })
    } catch (error) {
      if (error instanceof Error && error.message === 'TEAM_FULL') {
        return { success: false, message: 'Cette équipe est complète.' }
      }
      throw error
    }

    if (tournament.registrationType === RegistrationType.PAID) {
      return startPaidRegistrationCheckout({
        registrationId: registration.id,
        tournament,
        userId: session.user.id,
        returnPath: data.returnPath,
      })
    }

    updateTag(CACHE_TAGS.TOURNAMENTS)
    updateTag(CACHE_TAGS.DASHBOARD_REGISTRATIONS)
    updateTag(CACHE_TAGS.DASHBOARD_STATS)

    return {
      success: true,
      message:
        "Vous avez rejoint l'équipe et votre inscription a été enregistrée.",
    }
  },
})

// ---------------------------------------------------------------------------
// Pending checkout cancellation
// ---------------------------------------------------------------------------

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

    // Find the user's PENDING registration for this tournament
    const registration = await prisma.tournamentRegistration.findUnique({
      where: {
        tournamentId_userId: {
          tournamentId: data.tournamentId,
          userId,
        },
      },
      select: {
        id: true,
        status: true,
        teamId: true,
      },
    })

    // Idempotent: nothing to cancel
    if (!registration || registration.status !== RegistrationStatus.PENDING) {
      return { success: true, message: 'Aucune inscription en attente.' }
    }

    // Fetch the latest pending payment separately to avoid select/include mixing
    const pendingPayment = await prisma.payment.findFirst({
      where: {
        registrationId: registration.id,
        status: PaymentStatus.PENDING,
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        stripeCheckoutSessionId: true,
      },
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

    // Update DB: remove from team if needed, cancel payment and registration
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

    return { success: true, message: 'Inscription annul\u00e9e.' }
  },
})
