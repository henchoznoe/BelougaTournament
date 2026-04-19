/**
 * File: lib/actions/tournaments.ts
 * Description: Server actions for tournament CRUD, registration management, and user registration.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

'use server'

import { revalidateTag } from 'next/cache'
import { authenticatedAction } from '@/lib/actions/safe-action'
import { CACHE_TAGS } from '@/lib/config/constants'
import { env } from '@/lib/core/env'
import { logger } from '@/lib/core/logger'
import prisma from '@/lib/core/prisma'
import { getStripe, REGISTRATION_HOLD_MINUTES } from '@/lib/core/stripe'
import type { ActionState } from '@/lib/types/actions'
import type { TeamMemberWithTeam, TeamWithMembers } from '@/lib/types/team'
import { toNullable } from '@/lib/utils/formatting'
import {
  handleCaptainSuccession,
  removeUserFromTeam,
  syncTeamFullState,
} from '@/lib/utils/team'
import {
  isRefundEligible,
  validateFieldValues,
} from '@/lib/utils/tournament-helpers'
import {
  createTeamSchema,
  deleteTournamentSchema,
  dissolveTeamSchema,
  joinTeamSchema,
  kickPlayerSchema,
  registerForTournamentSchema,
  tournamentSchema,
  unregisterFromTournamentSchema,
  updateRegistrationFieldsSchema,
  updateTournamentSchema,
  updateTournamentStatusSchema,
} from '@/lib/validations/tournaments'
import {
  type FieldType,
  PaymentProvider,
  PaymentStatus,
  RefundPolicyType,
  RegistrationStatus,
  RegistrationType,
  Role,
  TournamentFormat,
  TournamentStatus,
} from '@/prisma/generated/prisma/enums'

// ---------------------------------------------------------------------------
// Local query result types (narrow shapes matching Prisma includes)
// ---------------------------------------------------------------------------

/** Tournament with its dynamic fields and a registration count. Used by updateTournament. */
type TournamentWithFieldsAndCount = {
  id: string
  format: TournamentFormat
  registrationType: RegistrationType
  entryFeeAmount: number | null
  entryFeeCurrency: string | null
  refundPolicyType: RefundPolicyType
  refundDeadlineDays: number | null
  status: TournamentStatus
  fields: { label: string; type: FieldType; required: boolean; order: number }[]
  _count: { registrations: number }
}

/** Tournament with its dynamic fields and registration-relevant scalars. Used by registration actions. */
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

/** Team with a member count. Used by joinTeamAndRegister. */
type TeamWithMemberCount = {
  id: string
  tournamentId: string
  _count: { members: number }
}

/** Builds an absolute URL from an application-relative path. */
const buildAbsoluteAppUrl = (path: string) => {
  return new URL(path, env.NEXT_PUBLIC_APP_URL).toString()
}

/**
 * Issues a Stripe refund AFTER the DB has already been updated to REFUNDED state.
 * If the Stripe API call fails, reverts the DB records back to their pre-refund state.
 * Uses an idempotency key to ensure the refund is safe to retry.
 */
const issueStripeRefundAfterDbUpdate = async ({
  registrationId,
  latestPayment,
  previousPaymentStatus,
  idempotencyPrefix,
  onRevert,
}: {
  registrationId: string
  latestPayment: {
    id: string
    amount: number
    stripePaymentIntentId: string | null
    stripeChargeId: string | null
  }
  previousPaymentStatus: PaymentStatus
  idempotencyPrefix: string
  onRevert?: (
    tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
  ) => Promise<void>
}) => {
  try {
    const stripe = getStripe()
    await stripe.refunds.create(
      latestPayment.stripePaymentIntentId
        ? {
            payment_intent: latestPayment.stripePaymentIntentId,
            reason: 'requested_by_customer',
          }
        : {
            charge: latestPayment.stripeChargeId ?? undefined,
            reason: 'requested_by_customer',
          },
      {
        idempotencyKey: `${idempotencyPrefix}-${registrationId}-${latestPayment.id}`,
      },
    )
  } catch (error) {
    // Stripe refund failed — revert DB records back to pre-refund state
    logger.error(
      { error, registrationId },
      'Stripe refund failed, reverting DB state',
    )
    await prisma.$transaction(async tx => {
      await tx.tournamentRegistration.update({
        where: { id: registrationId },
        data: {
          status: RegistrationStatus.CONFIRMED,
          paymentStatus: previousPaymentStatus,
          cancelledAt: null,
        },
      })
      await tx.payment.update({
        where: { id: latestPayment.id },
        data: {
          status: previousPaymentStatus,
          refundAmount: null,
          refundedAt: null,
        },
      })
      if (onRevert) await onRevert(tx)
    })
    throw error
  }
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
        'Le paiement Stripe n’est pas correctement configuré pour ce tournoi.',
    }
  }

  const expiresAt = new Date(Date.now() + REGISTRATION_HOLD_MINUTES * 60 * 1000)
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
        client_reference_id: registrationId,
        success_url: buildAbsoluteAppUrl(
          `${returnPath}${returnPath.includes('?') ? '&' : '?'}stripe=success`,
        ),
        cancel_url: buildAbsoluteAppUrl(
          `${returnPath}${returnPath.includes('?') ? '&' : '?'}stripe=cancelled`,
        ),
        expires_at: Math.floor(expiresAt.getTime() / 1000),
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
          ? new Date(Date.now() + REGISTRATION_HOLD_MINUTES * 60 * 1000)
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
        ? new Date(Date.now() + REGISTRATION_HOLD_MINUTES * 60 * 1000)
        : null,
    },
  })
}

/** Creates a new tournament with its dynamic fields. */
export const createTournament = authenticatedAction({
  schema: tournamentSchema,
  role: Role.ADMIN,
  handler: async (data): Promise<ActionState> => {
    await prisma.tournament.create({
      data: {
        title: data.title,
        slug: data.slug,
        description: data.description,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        registrationOpen: new Date(data.registrationOpen),
        registrationClose: new Date(data.registrationClose),
        maxTeams: data.maxTeams,
        registrationType: data.registrationType,
        entryFeeAmount: data.entryFeeAmount,
        entryFeeCurrency:
          data.registrationType === RegistrationType.PAID
            ? data.entryFeeCurrency
            : null,
        refundPolicyType:
          data.registrationType === RegistrationType.PAID
            ? data.refundPolicyType
            : RefundPolicyType.NONE,
        refundDeadlineDays:
          data.registrationType === RegistrationType.PAID
            ? data.refundDeadlineDays
            : null,
        format: data.format,
        teamSize: data.teamSize,
        game: toNullable(data.game),
        rules: toNullable(data.rules),
        prize: toNullable(data.prize),
        toornamentId: toNullable(data.toornamentId),
        imageUrls: data.imageUrls,
        streamUrl: toNullable(data.streamUrl),
        fields: {
          create: data.fields.map(field => ({
            label: field.label,
            type: field.type,
            required: field.required,
            order: field.order,
          })),
        },
        toornamentStages: {
          create: data.toornamentStages.map(stage => ({
            name: stage.name,
            stageId: stage.stageId,
            number: stage.number,
          })),
        },
      },
    })

    revalidateTag(CACHE_TAGS.TOURNAMENTS, 'hours')
    revalidateTag(CACHE_TAGS.DASHBOARD_STATS, 'minutes')

    return {
      success: true,
      message: 'Le tournoi a été créé.',
    }
  },
})

/** Updates an existing tournament and syncs its dynamic fields. */
export const updateTournament = authenticatedAction({
  schema: updateTournamentSchema,
  role: Role.ADMIN,
  handler: async (data): Promise<ActionState> => {
    // Fetch existing tournament to enforce immutability rules
    const existing = (await prisma.tournament.findUnique({
      where: { id: data.id },
      include: {
        fields: { orderBy: { order: 'asc' } },
        _count: { select: { registrations: true } },
      },
    })) as TournamentWithFieldsAndCount | null

    if (!existing) {
      return { success: false, message: 'Tournoi introuvable.' }
    }

    // Format is immutable after creation
    if (data.format !== existing.format) {
      return {
        success: false,
        message:
          'Le format du tournoi ne peut pas être modifié après la création.',
      }
    }

    if (data.registrationType !== existing.registrationType) {
      return {
        success: false,
        message:
          'Le mode d’inscription ne peut pas être modifié après la création.',
      }
    }

    if (data.entryFeeAmount !== existing.entryFeeAmount) {
      return {
        success: false,
        message:
          'Le prix d\u2019entrée ne peut pas être modifié après la création.',
      }
    }

    // Only compare currency for PAID tournaments (FREE tournaments store null in DB but form sends 'CHF')
    if (
      existing.entryFeeCurrency !== null &&
      data.entryFeeCurrency !== existing.entryFeeCurrency
    ) {
      return {
        success: false,
        message:
          'La devise du prix d\u2019entrée ne peut pas être modifiée après la création.',
      }
    }

    if (data.refundPolicyType !== existing.refundPolicyType) {
      return {
        success: false,
        message:
          'La politique de remboursement ne peut pas être modifiée après la création.',
      }
    }

    if (data.refundDeadlineDays !== existing.refundDeadlineDays) {
      return {
        success: false,
        message:
          'Le délai de remboursement ne peut pas être modifié après la création.',
      }
    }

    // Dynamic fields are locked when tournament is PUBLISHED with registrations
    if (
      existing.status === TournamentStatus.PUBLISHED &&
      existing._count.registrations > 0
    ) {
      const existingFields = existing.fields.map(f => ({
        label: f.label,
        type: f.type,
        required: f.required,
        order: f.order,
      }))
      const submittedFields = data.fields.map(f => ({
        label: f.label,
        type: f.type,
        required: f.required,
        order: f.order,
      }))
      const fieldsChanged =
        JSON.stringify(existingFields) !== JSON.stringify(submittedFields)
      if (fieldsChanged) {
        return {
          success: false,
          message:
            'Les champs personnalisés ne peuvent pas être modifiés lorsque le tournoi est publié et a des inscriptions.',
        }
      }
    }

    await prisma.$transaction([
      // Delete existing fields and stages, then re-create them
      prisma.tournamentField.deleteMany({
        where: { tournamentId: data.id },
      }),
      prisma.toornamentStage.deleteMany({
        where: { tournamentId: data.id },
      }),
      prisma.tournament.update({
        where: { id: data.id },
        data: {
          title: data.title,
          slug: data.slug,
          description: data.description,
          startDate: new Date(data.startDate),
          endDate: new Date(data.endDate),
          registrationOpen: new Date(data.registrationOpen),
          registrationClose: new Date(data.registrationClose),
          maxTeams: data.maxTeams,
          registrationType: data.registrationType,
          entryFeeAmount: data.entryFeeAmount,
          entryFeeCurrency:
            data.registrationType === RegistrationType.PAID
              ? data.entryFeeCurrency
              : null,
          refundPolicyType:
            data.registrationType === RegistrationType.PAID
              ? data.refundPolicyType
              : RefundPolicyType.NONE,
          refundDeadlineDays:
            data.registrationType === RegistrationType.PAID
              ? data.refundDeadlineDays
              : null,
          format: data.format,
          teamSize: data.teamSize,
          game: toNullable(data.game),
          rules: toNullable(data.rules),
          prize: toNullable(data.prize),
          toornamentId: toNullable(data.toornamentId),
          imageUrls: data.imageUrls,
          streamUrl: toNullable(data.streamUrl),
          fields: {
            create: data.fields.map(field => ({
              label: field.label,
              type: field.type,
              required: field.required,
              order: field.order,
            })),
          },
          toornamentStages: {
            create: data.toornamentStages.map(stage => ({
              name: stage.name,
              stageId: stage.stageId,
              number: stage.number,
            })),
          },
        },
      }),
    ])

    revalidateTag(CACHE_TAGS.TOURNAMENTS, 'hours')

    return {
      success: true,
      message: 'Le tournoi a été mis à jour.',
    }
  },
})

/** Deletes a tournament by ID. */
export const deleteTournament = authenticatedAction({
  schema: deleteTournamentSchema,
  role: Role.ADMIN,
  handler: async (data): Promise<ActionState> => {
    // Prevent deletion if there are active (PAID) payments — refund them first
    const paidCount = await prisma.tournamentRegistration.count({
      where: {
        tournamentId: data.id,
        paymentStatus: PaymentStatus.PAID,
      },
    })
    if (paidCount > 0) {
      return {
        success: false,
        message:
          "Impossible de supprimer ce tournoi : des inscriptions payées existent. Remboursez-les d'abord.",
      }
    }

    await prisma.tournament.delete({
      where: { id: data.id },
    })

    revalidateTag(CACHE_TAGS.TOURNAMENTS, 'hours')
    revalidateTag(CACHE_TAGS.DASHBOARD_STATS, 'minutes')
    revalidateTag(CACHE_TAGS.DASHBOARD_REGISTRATIONS, 'minutes')

    return {
      success: true,
      message: 'Le tournoi a été supprimé.',
    }
  },
})

/** Updates a tournament's status (DRAFT / PUBLISHED / ARCHIVED). */
export const updateTournamentStatus = authenticatedAction({
  schema: updateTournamentStatusSchema,
  role: Role.ADMIN,
  handler: async (data): Promise<ActionState> => {
    // Prevent reverting to DRAFT if there are paid registrations
    if (data.status === TournamentStatus.DRAFT) {
      const paidCount = await prisma.tournamentRegistration.count({
        where: {
          tournamentId: data.id,
          paymentStatus: PaymentStatus.PAID,
        },
      })
      if (paidCount > 0) {
        return {
          success: false,
          message:
            "Impossible de repasser en brouillon : des inscriptions payées existent. Remboursez-les d'abord.",
        }
      }
    }

    await prisma.tournament.update({
      where: { id: data.id },
      data: { status: data.status },
    })

    revalidateTag(CACHE_TAGS.TOURNAMENTS, 'hours')
    revalidateTag(CACHE_TAGS.DASHBOARD_STATS, 'minutes')

    return {
      success: true,
      message: 'Le statut du tournoi a été mis à jour.',
    }
  },
})

// ---------------------------------------------------------------------------
// Public registration
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

    revalidateTag(CACHE_TAGS.TOURNAMENTS, 'hours')
    revalidateTag(CACHE_TAGS.DASHBOARD_REGISTRATIONS, 'minutes')

    return {
      success: true,
      message: 'Votre inscription a été mise à jour.',
    }
  },
})

/** Registers the current user for a tournament (solo format). */
export const registerForTournament = authenticatedAction({
  schema: registerForTournamentSchema,
  handler: async (data, session): Promise<ActionState> => {
    // 1. Shared pre-checks (ban, tournament, window, duplicate)
    const result = await fetchTournamentForRegistration(
      session.user.id,
      data.tournamentId,
    )
    if ('error' in result) return result.error
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

    revalidateTag(CACHE_TAGS.TOURNAMENTS, 'hours')
    revalidateTag(CACHE_TAGS.DASHBOARD_REGISTRATIONS, 'minutes')

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
  handler: async (data, session): Promise<ActionState> => {
    // 1. Shared pre-checks (ban, tournament, window, duplicate)
    const result = await fetchTournamentForRegistration(
      session.user.id,
      data.tournamentId,
    )
    if ('error' in result) return result.error
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

    revalidateTag(CACHE_TAGS.TOURNAMENTS, 'hours')
    revalidateTag(CACHE_TAGS.DASHBOARD_REGISTRATIONS, 'minutes')
    revalidateTag(CACHE_TAGS.DASHBOARD_STATS, 'minutes')

    return {
      success: true,
      message: 'Votre équipe a été créée et votre inscription enregistrée.',
    }
  },
})

/** Joins an existing team and registers the current user. */
export const joinTeamAndRegister = authenticatedAction({
  schema: joinTeamSchema,
  handler: async (data, session): Promise<ActionState> => {
    // 1. Shared pre-checks (ban, tournament, window, duplicate)
    const result = await fetchTournamentForRegistration(
      session.user.id,
      data.tournamentId,
    )
    if ('error' in result) return result.error
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

    revalidateTag(CACHE_TAGS.TOURNAMENTS, 'hours')
    revalidateTag(CACHE_TAGS.DASHBOARD_REGISTRATIONS, 'minutes')
    revalidateTag(CACHE_TAGS.DASHBOARD_STATS, 'minutes')

    return {
      success: true,
      message:
        "Vous avez rejoint l'équipe et votre inscription a été enregistrée.",
    }
  },
})

// ---------------------------------------------------------------------------
// Player unregistration
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

// ---------------------------------------------------------------------------
// Admin team management
// ---------------------------------------------------------------------------

/** Kicks a player from a team. If the player is captain, promotes the next member or dissolves the team. */
export const kickPlayer = authenticatedAction({
  schema: kickPlayerSchema,
  role: Role.ADMIN,
  handler: async (data): Promise<ActionState> => {
    // Fetch team with members ordered by join date
    const team = (await prisma.team.findUnique({
      where: { id: data.teamId },
      include: {
        tournament: { select: { teamSize: true } },
        members: { orderBy: { joinedAt: 'asc' } },
      },
    })) as TeamWithMembers | null

    if (!team || team.tournamentId !== data.tournamentId) {
      return { success: false, message: 'Équipe introuvable.' }
    }

    const isMember = team.members.some(m => m.userId === data.userId)
    if (!isMember) {
      return {
        success: false,
        message: "Ce joueur ne fait pas partie de l'équipe.",
      }
    }

    const registration = await prisma.tournamentRegistration.findUnique({
      where: {
        tournamentId_userId: {
          tournamentId: data.tournamentId,
          userId: data.userId,
        },
      },
      select: {
        id: true,
        paymentRequiredSnapshot: true,
        paymentStatus: true,
      },
    })

    await prisma.$transaction(async tx => {
      // 1. Remove team member record
      await tx.teamMember.deleteMany({
        where: { teamId: data.teamId, userId: data.userId },
      })

      // 2. Remove or cancel tournament registration
      if (registration?.paymentRequiredSnapshot) {
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
        await tx.tournamentRegistration.deleteMany({
          where: { tournamentId: data.tournamentId, userId: data.userId },
        })
      }

      // 3. Handle captain succession / team cleanup
      await handleCaptainSuccession(tx, team, data.userId)
    })

    revalidateTag(CACHE_TAGS.TOURNAMENTS, 'hours')
    revalidateTag(CACHE_TAGS.DASHBOARD_REGISTRATIONS, 'minutes')
    revalidateTag(CACHE_TAGS.DASHBOARD_STATS, 'minutes')
    revalidateTag(CACHE_TAGS.DASHBOARD_PAYMENTS, 'minutes')

    return {
      success: true,
      message: "Le joueur a été retiré de l'équipe.",
    }
  },
})

/** Dissolves a team and removes all member registrations. */
export const dissolveTeam = authenticatedAction({
  schema: dissolveTeamSchema,
  role: Role.ADMIN,
  handler: async (data): Promise<ActionState> => {
    // Fetch team with members to get all user IDs
    const team = (await prisma.team.findUnique({
      where: { id: data.teamId },
      include: { members: true },
    })) as TeamWithMembers | null

    if (!team || team.tournamentId !== data.tournamentId) {
      return { success: false, message: 'Équipe introuvable.' }
    }

    const memberUserIds = team.members.map(m => m.userId)
    const registrations = await prisma.tournamentRegistration.findMany({
      where: {
        tournamentId: data.tournamentId,
        userId: { in: memberUserIds },
      },
      select: {
        id: true,
        userId: true,
        paymentRequiredSnapshot: true,
        paymentStatus: true,
      },
    })

    await prisma.$transaction(async tx => {
      // 1. Delete free registrations and cancel paid ones
      for (const registration of registrations) {
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
      }

      // 2. Delete the team (cascades to TeamMember records)
      await tx.team.delete({ where: { id: data.teamId } })
    })

    revalidateTag(CACHE_TAGS.TOURNAMENTS, 'hours')
    revalidateTag(CACHE_TAGS.DASHBOARD_REGISTRATIONS, 'minutes')
    revalidateTag(CACHE_TAGS.DASHBOARD_STATS, 'minutes')
    revalidateTag(CACHE_TAGS.DASHBOARD_PAYMENTS, 'minutes')

    return { success: true, message: "L'équipe a été dissoute." }
  },
})
