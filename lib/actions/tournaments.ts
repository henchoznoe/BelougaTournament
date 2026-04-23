/**
 * File: lib/actions/tournaments.ts
 * Description: Server actions for tournament CRUD and status management.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

'use server'

import { updateTag } from 'next/cache'
import { authenticatedAction } from '@/lib/actions/safe-action'
import { CACHE_TAGS } from '@/lib/config/constants'
import prisma from '@/lib/core/prisma'
import type { ActionState } from '@/lib/types/actions'
import { toNullable } from '@/lib/utils/formatting'
import {
  deleteTournamentSchema,
  tournamentSchema,
  updateTournamentSchema,
  updateTournamentStatusSchema,
} from '@/lib/validations/tournaments'
import {
  DonationType,
  type FieldType,
  PaymentStatus,
  RefundPolicyType,
  RegistrationType,
  Role,
  type TournamentFormat,
  TournamentStatus,
} from '@/prisma/generated/prisma/enums'

// ---------------------------------------------------------------------------
// Local query result types (narrow shapes matching Prisma includes)
// ---------------------------------------------------------------------------

/** Tournament with its dynamic fields and a registration count. Used by updateTournament. */
type TournamentWithFieldsAndCount = {
  id: string
  slug: string
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

// ---------------------------------------------------------------------------
// Tournament CRUD
// ---------------------------------------------------------------------------

/** Creates a new tournament with its dynamic fields. */
export const createTournament = authenticatedAction({
  schema: tournamentSchema,
  role: Role.ADMIN,
  handler: async (data): Promise<ActionState> => {
    // Generate a unique slug: if the base slug is taken, append -2, -3, etc.
    const baseSlug = data.slug
    let slug = baseSlug
    let suffix = 2
    while (await prisma.tournament.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${suffix}`
      suffix++
    }

    await prisma.tournament.create({
      data: {
        title: data.title,
        slug,
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
        teamLogoEnabled: data.teamLogoEnabled,
        donationEnabled:
          data.registrationType === RegistrationType.PAID
            ? data.donationEnabled
            : false,
        donationType:
          data.registrationType === RegistrationType.PAID &&
          data.donationEnabled
            ? /* v8 ignore next */ (data.donationType ?? null)
            : null,
        donationFixedAmount:
          data.registrationType === RegistrationType.PAID &&
          data.donationEnabled &&
          data.donationType === DonationType.FIXED
            ? /* v8 ignore next */ (data.donationFixedAmount ?? null)
            : null,
        donationMinAmount:
          data.registrationType === RegistrationType.PAID &&
          data.donationEnabled &&
          data.donationType === DonationType.FREE
            ? /* v8 ignore next */ (data.donationMinAmount ?? null)
            : null,
        games: data.games,
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

    updateTag(CACHE_TAGS.TOURNAMENTS)
    updateTag(CACHE_TAGS.DASHBOARD_STATS)

    return {
      success: true,
      message: 'Le tournoi a été créé.',
      data: { slug },
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

    // Slug is immutable after creation — always use the existing slug
    const slug = existing.slug

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
          "Le mode d'inscription ne peut pas être modifié après la création.",
      }
    }

    if (data.entryFeeAmount !== existing.entryFeeAmount) {
      return {
        success: false,
        message: "Le prix d'entrée ne peut pas être modifié après la création.",
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
          "La devise du prix d'entrée ne peut pas être modifiée après la création.",
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
          slug,
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
          teamLogoEnabled: data.teamLogoEnabled,
          donationEnabled:
            data.registrationType === RegistrationType.PAID
              ? data.donationEnabled
              : false,
          donationType:
            data.registrationType === RegistrationType.PAID &&
            data.donationEnabled
              ? /* v8 ignore next */ (data.donationType ?? null)
              : null,
          donationFixedAmount:
            data.registrationType === RegistrationType.PAID &&
            data.donationEnabled &&
            data.donationType === DonationType.FIXED
              ? /* v8 ignore next */ (data.donationFixedAmount ?? null)
              : null,
          donationMinAmount:
            data.registrationType === RegistrationType.PAID &&
            data.donationEnabled &&
            data.donationType === DonationType.FREE
              ? /* v8 ignore next */ (data.donationMinAmount ?? null)
              : null,
          games: data.games,
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

    updateTag(CACHE_TAGS.TOURNAMENTS)

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

    updateTag(CACHE_TAGS.TOURNAMENTS)
    updateTag(CACHE_TAGS.DASHBOARD_STATS)
    updateTag(CACHE_TAGS.DASHBOARD_REGISTRATIONS)

    return {
      success: true,
      message: 'Le tournoi a été supprimé.',
    }
  },
})

// ---------------------------------------------------------------------------
// Tournament status
// ---------------------------------------------------------------------------

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

    updateTag(CACHE_TAGS.TOURNAMENTS)
    updateTag(CACHE_TAGS.DASHBOARD_STATS)

    return {
      success: true,
      message: 'Le statut du tournoi a été mis à jour.',
    }
  },
})
