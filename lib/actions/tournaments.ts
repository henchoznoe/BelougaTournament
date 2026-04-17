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
import prisma from '@/lib/core/prisma'
import { getStripe, REGISTRATION_HOLD_MINUTES } from '@/lib/core/stripe'
import type { ActionState } from '@/lib/types/actions'
import { isBanned } from '@/lib/utils/auth.helpers'
import { toNullable } from '@/lib/utils/formatting'
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
  FieldType,
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

/** Team with ordered members list. Used by kickPlayer and unregisterFromTournament. */
type TeamWithMembers = {
  id: string
  tournamentId: string
  captainId: string
  tournament: { teamSize: number }
  members: { userId: string }[]
}

/** Team member with nested team (including members). Used by unregisterFromTournament. */
type TeamMemberWithTeam = {
  team: TeamWithMembers
}

/**
 * Checks whether a user is currently banned.
 * Returns an ActionState error if banned, or null if not banned.
 */
const checkBanStatus = async (userId: string): Promise<ActionState | null> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { bannedUntil: true },
  })
  if (user && isBanned(user.bannedUntil)) {
    return { success: false, message: 'Votre compte est banni.' }
  }
  return null
}

/** Validates dynamic field values against tournament field definitions. */
const validateFieldValues = (
  fields: { label: string; type: string; required: boolean }[],
  fieldValues: Record<string, string | number>,
): { valid: true } | { valid: false; message: string } => {
  for (const field of fields) {
    const value = fieldValues[field.label]
    if (field.required && (value === undefined || value === '')) {
      return {
        valid: false,
        message: `Le champ \u00ab ${field.label} \u00bb est requis.`,
      }
    }
    if (
      field.type === FieldType.NUMBER &&
      value !== undefined &&
      value !== ''
    ) {
      if (typeof value !== 'number' || Number.isNaN(value)) {
        return {
          valid: false,
          message: `Le champ \u00ab ${field.label} \u00bb doit \u00eatre un nombre.`,
        }
      }
    }
  }
  return { valid: true }
}

/** Returns true when a player is still eligible for an automatic refund. */
const isRefundEligible = (
  startDate: Date,
  refundPolicyType: RefundPolicyType,
  refundDeadlineDays: number | null,
  now: Date,
) => {
  if (refundPolicyType !== RefundPolicyType.BEFORE_DEADLINE) {
    return false
  }

  if (refundDeadlineDays === null) {
    return false
  }

  return (
    startDate.getTime() - now.getTime() >=
    refundDeadlineDays * 24 * 60 * 60 * 1000
  )
}

/** Recomputes the `isFull` flag for a team after a membership mutation. */
const syncTeamFullState = async (
  tx: Pick<typeof prisma, 'team' | 'teamMember'>,
  teamId: string,
  teamSize: number,
) => {
  const memberCount = await tx.teamMember.count({ where: { teamId } })

  await tx.team.update({
    where: { id: teamId },
    data: { isFull: memberCount >= teamSize },
  })
}

/** Builds an absolute URL from an application-relative path. */
const buildAbsoluteAppUrl = (path: string) => {
  return new URL(path, env.NEXT_PUBLIC_APP_URL).toString()
}

/** Removes a user from their team while keeping the registration row intact. */
const removeUserFromTeam = async (
  tx: Pick<typeof prisma, 'team' | 'teamMember'>,
  userId: string,
  tournamentId: string,
) => {
  const teamMember = (await tx.teamMember.findFirst({
    where: { userId, team: { tournamentId } },
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
    return
  }

  const team = teamMember.team
  const otherMembers = team.members.filter(member => member.userId !== userId)
  const isCaptain = team.captainId === userId

  await tx.teamMember.deleteMany({ where: { teamId: team.id, userId } })

  if (otherMembers.length === 0) {
    await tx.team.delete({ where: { id: team.id } })
    return
  }

  if (isCaptain) {
    await tx.team.update({
      where: { id: team.id },
      data: { captainId: otherMembers[0].userId },
    })
  }

  await syncTeamFullState(tx, team.id, team.tournament.teamSize)
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
  } catch (_error) {
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
 * Verifies: ban status, tournament exists & PUBLISHED, registration window open, no duplicate registration.
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
  // 1. Check ban status
  const banResult = await checkBanStatus(userId)
  if (banResult) return { error: banResult }

  // 2. Fetch tournament with fields
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

  // 3. Check registration window
  const now = new Date()
  if (now < tournament.registrationOpen || now > tournament.registrationClose) {
    return {
      error: {
        success: false,
        message: 'Les inscriptions ne sont pas ouvertes.',
      },
    }
  }

  // 4. Load any existing registration for reuse or duplicate detection
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

  return {
    tournament,
    existingRegistration: existing as ExistingRegistration | null,
  }
}

/** Creates or refreshes a registration row for the next registration attempt. */
const upsertRegistrationAttempt = async ({
  existingRegistration,
  tournament,
  userId,
  fieldValues,
  teamId,
}: {
  existingRegistration: ExistingRegistration | null
  tournament: TournamentWithFields
  userId: string
  fieldValues: Record<string, string | number>
  teamId?: string | null
}) => {
  const isPaid = tournament.registrationType === RegistrationType.PAID

  if (existingRegistration) {
    return prisma.tournamentRegistration.update({
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

  return prisma.tournamentRegistration.create({
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
        imageUrl: toNullable(data.imageUrl),
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
    revalidateTag(CACHE_TAGS.TOURNAMENT_OPTIONS, 'minutes')
    revalidateTag(CACHE_TAGS.DASHBOARD_STATS, 'minutes')

    return {
      success: true,
      message: 'Le tournoi a \u00e9t\u00e9 cr\u00e9\u00e9.',
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
          'Le format du tournoi ne peut pas \u00eatre modifi\u00e9 apr\u00e8s la cr\u00e9ation.',
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
        message: 'Le prix d’entrée ne peut pas être modifié après la création.',
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
            'Les champs personnalis\u00e9s ne peuvent pas \u00eatre modifi\u00e9s lorsque le tournoi est publi\u00e9 et a des inscriptions.',
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
          imageUrl: toNullable(data.imageUrl),
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
    revalidateTag(CACHE_TAGS.TOURNAMENT_OPTIONS, 'minutes')
    revalidateTag(CACHE_TAGS.DASHBOARD_UPCOMING, 'minutes')

    return {
      success: true,
      message: 'Le tournoi a \u00e9t\u00e9 mis \u00e0 jour.',
    }
  },
})

/** Deletes a tournament by ID. */
export const deleteTournament = authenticatedAction({
  schema: deleteTournamentSchema,
  role: Role.ADMIN,
  handler: async (data): Promise<ActionState> => {
    await prisma.tournament.delete({
      where: { id: data.id },
    })

    revalidateTag(CACHE_TAGS.TOURNAMENTS, 'hours')
    revalidateTag(CACHE_TAGS.TOURNAMENT_OPTIONS, 'minutes')
    revalidateTag(CACHE_TAGS.DASHBOARD_STATS, 'minutes')
    revalidateTag(CACHE_TAGS.DASHBOARD_UPCOMING, 'minutes')
    revalidateTag(CACHE_TAGS.DASHBOARD_REGISTRATIONS, 'minutes')
    revalidateTag(CACHE_TAGS.REGISTRATIONS, 'minutes')

    return {
      success: true,
      message: 'Le tournoi a \u00e9t\u00e9 supprim\u00e9.',
    }
  },
})

/** Updates a tournament's status (DRAFT / PUBLISHED / ARCHIVED). */
export const updateTournamentStatus = authenticatedAction({
  schema: updateTournamentStatusSchema,
  role: Role.ADMIN,
  handler: async (data): Promise<ActionState> => {
    await prisma.tournament.update({
      where: { id: data.id },
      data: { status: data.status },
    })

    revalidateTag(CACHE_TAGS.TOURNAMENTS, 'hours')
    revalidateTag(CACHE_TAGS.TOURNAMENT_OPTIONS, 'minutes')
    revalidateTag(CACHE_TAGS.DASHBOARD_STATS, 'minutes')
    revalidateTag(CACHE_TAGS.DASHBOARD_UPCOMING, 'minutes')

    return {
      success: true,
      message: 'Le statut du tournoi a \u00e9t\u00e9 mis \u00e0 jour.',
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
    revalidateTag(CACHE_TAGS.REGISTRATIONS, 'minutes')

    return {
      success: true,
      message: 'Votre inscription a \u00e9t\u00e9 mise \u00e0 jour.',
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
          'Ce tournoi est en format \u00e9quipe. Utilisez le formulaire \u00e9quipe.',
      }
    }

    // 3. Check maxTeams limit (registrations count as "slots" for solo)
    if (tournament.maxTeams !== null) {
      const count = await prisma.tournamentRegistration.count({
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
        return { success: false, message: 'Le tournoi est complet.' }
      }
    }

    // 4. Validate dynamic field values
    const validation = validateFieldValues(tournament.fields, data.fieldValues)
    if (!validation.valid) {
      return { success: false, message: validation.message }
    }

    const registration = await upsertRegistrationAttempt({
      existingRegistration,
      tournament,
      userId: session.user.id,
      fieldValues: data.fieldValues,
      teamId: null,
    })

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
    revalidateTag(CACHE_TAGS.REGISTRATIONS, 'minutes')

    return {
      success: true,
      message: 'Votre inscription a \u00e9t\u00e9 enregistr\u00e9e.',
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

    // 3. Check maxTeams limit (count teams, not registrations)
    if (tournament.maxTeams !== null) {
      const teamCount = await prisma.team.count({
        where: { tournamentId: data.tournamentId },
      })
      if (teamCount >= tournament.maxTeams) {
        return {
          success: false,
          message: "Le nombre maximum d'\u00e9quipes est atteint.",
        }
      }
    }

    // 4. Validate dynamic field values
    const validation = validateFieldValues(tournament.fields, data.fieldValues)
    if (!validation.valid) {
      return { success: false, message: validation.message }
    }

    const registration = await prisma.$transaction(async tx => {
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
        existingRegistration,
        tournament,
        userId: session.user.id,
        fieldValues: data.fieldValues,
        teamId: team.id,
      })

      await syncTeamFullState(tx, team.id, tournament.teamSize)

      return registration
    })

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
    revalidateTag(CACHE_TAGS.REGISTRATIONS, 'minutes')
    revalidateTag(CACHE_TAGS.DASHBOARD_STATS, 'minutes')

    return {
      success: true,
      message:
        'Votre \u00e9quipe a \u00e9t\u00e9 cr\u00e9\u00e9e et votre inscription enregistr\u00e9e.',
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

    // 3. Fetch team and verify it belongs to the tournament and is not full
    const team = (await prisma.team.findUnique({
      where: { id: data.teamId },
      include: { _count: { select: { members: true } } },
    })) as TeamWithMemberCount | null

    if (!team || team.tournamentId !== data.tournamentId) {
      return { success: false, message: '\u00c9quipe introuvable.' }
    }

    if (team._count.members >= tournament.teamSize) {
      return { success: false, message: 'Cette équipe est complète.' }
    }

    // 4. Validate dynamic field values
    const validation = validateFieldValues(tournament.fields, data.fieldValues)
    if (!validation.valid) {
      return { success: false, message: validation.message }
    }

    const registration = await prisma.$transaction(async tx => {
      await removeUserFromTeam(tx, session.user.id, data.tournamentId)

      await tx.teamMember.create({
        data: {
          teamId: data.teamId,
          userId: session.user.id,
        },
      })

      const registration = await upsertRegistrationAttempt({
        existingRegistration,
        tournament,
        userId: session.user.id,
        fieldValues: data.fieldValues,
        teamId: data.teamId,
      })

      await syncTeamFullState(tx, data.teamId, tournament.teamSize)

      return registration
    })

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
    revalidateTag(CACHE_TAGS.REGISTRATIONS, 'minutes')
    revalidateTag(CACHE_TAGS.DASHBOARD_STATS, 'minutes')

    return {
      success: true,
      message:
        "Vous avez rejoint l'\u00e9quipe et votre inscription a \u00e9t\u00e9 enregistr\u00e9e.",
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

    // 1. Check ban status
    const banResult = await checkBanStatus(userId)
    if (banResult) return banResult

    // 2. Fetch the registration with tournament info
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

    if (
      refundEligible &&
      latestPayment &&
      latestPayment.status === PaymentStatus.PAID
    ) {
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
          idempotencyKey: `refund-${registration.id}-${latestPayment.id}`,
        },
      )
    }

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

      revalidateTag(CACHE_TAGS.TOURNAMENTS, 'hours')
      revalidateTag(CACHE_TAGS.DASHBOARD_REGISTRATIONS, 'minutes')
      revalidateTag(CACHE_TAGS.REGISTRATIONS, 'minutes')
      revalidateTag(CACHE_TAGS.DASHBOARD_STATS, 'minutes')

      return {
        success: true,
        message: refundEligible
          ? 'Votre inscription a été annulée et remboursée.'
          : 'Votre inscription a été annulée. Cette désinscription n’ouvre pas droit à un remboursement automatique.',
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

      revalidateTag(CACHE_TAGS.TOURNAMENTS, 'hours')
      revalidateTag(CACHE_TAGS.DASHBOARD_REGISTRATIONS, 'minutes')
      revalidateTag(CACHE_TAGS.REGISTRATIONS, 'minutes')
      revalidateTag(CACHE_TAGS.DASHBOARD_STATS, 'minutes')

      return {
        success: true,
        message: refundEligible
          ? 'Votre inscription a été annulée et remboursée.'
          : 'Votre inscription a été annulée. Cette désinscription n’ouvre pas droit à un remboursement automatique.',
      }
    }

    const team = teamMember.team
    const isCaptain = team.captainId === userId
    const otherMembers = team.members.filter(m => m.userId !== userId)

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

      if (isCaptain && otherMembers.length > 0) {
        // c. Promote next member to captain
        const newCaptain = otherMembers[0]

        await tx.team.update({
          where: { id: team.id },
          data: { captainId: newCaptain.userId },
        })
        await syncTeamFullState(tx, team.id, team.tournament.teamSize)
      } else if (otherMembers.length === 0) {
        // d. Last member — dissolve the team
        await tx.team.delete({ where: { id: team.id } })
      } else {
        // e. Non-captain leaving — keep team state in sync
        await syncTeamFullState(tx, team.id, team.tournament.teamSize)
      }
    })

    revalidateTag(CACHE_TAGS.TOURNAMENTS, 'hours')
    revalidateTag(CACHE_TAGS.DASHBOARD_REGISTRATIONS, 'minutes')
    revalidateTag(CACHE_TAGS.REGISTRATIONS, 'minutes')
    revalidateTag(CACHE_TAGS.DASHBOARD_STATS, 'minutes')

    return {
      success: true,
      message: refundEligible
        ? 'Votre inscription a été annulée et remboursée.'
        : 'Votre inscription a été annulée. Cette désinscription n’ouvre pas droit à un remboursement automatique.',
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
      return { success: false, message: '\u00c9quipe introuvable.' }
    }

    const isMember = team.members.some(m => m.userId === data.userId)
    if (!isMember) {
      return {
        success: false,
        message: "Ce joueur ne fait pas partie de l'\u00e9quipe.",
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

    const isCaptain = team.captainId === data.userId
    const otherMembers = team.members.filter(m => m.userId !== data.userId)

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

      if (isCaptain && otherMembers.length > 0) {
        // 3a. Promote next member to captain
        const newCaptain = otherMembers[0]

        await tx.team.update({
          where: { id: data.teamId },
          data: { captainId: newCaptain.userId },
        })
        await syncTeamFullState(tx, data.teamId, team.tournament.teamSize)
      } else if (isCaptain && otherMembers.length === 0) {
        // 3b. Last member — dissolve the team
        await tx.team.delete({ where: { id: data.teamId } })
      } else {
        // 3c. Non-captain kicked — keep team state in sync
        await syncTeamFullState(tx, data.teamId, team.tournament.teamSize)
      }
    })

    revalidateTag(CACHE_TAGS.TOURNAMENTS, 'hours')
    revalidateTag(CACHE_TAGS.DASHBOARD_REGISTRATIONS, 'minutes')
    revalidateTag(CACHE_TAGS.REGISTRATIONS, 'minutes')
    revalidateTag(CACHE_TAGS.DASHBOARD_STATS, 'minutes')

    return {
      success: true,
      message: "Le joueur a \u00e9t\u00e9 retir\u00e9 de l'\u00e9quipe.",
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
      return { success: false, message: '\u00c9quipe introuvable.' }
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
    revalidateTag(CACHE_TAGS.REGISTRATIONS, 'minutes')
    revalidateTag(CACHE_TAGS.DASHBOARD_STATS, 'minutes')

    return { success: true, message: "L'\u00e9quipe a \u00e9t\u00e9 dissoute." }
  },
})
