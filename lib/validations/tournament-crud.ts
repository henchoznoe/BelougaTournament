/**
 * File: lib/validations/tournament-crud.ts
 * Description: Zod schemas for admin tournament CRUD operations
 *   (create, update, delete, status change, field and stage sub-schemas).
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { z } from 'zod'
import {
  CENTIMES_PER_UNIT,
  DONATION_MAX_AMOUNT,
  DONATION_MIN_AMOUNT,
  ENTRY_FEE_MAX_AMOUNT,
  ENTRY_FEE_MIN_AMOUNT,
  VALIDATION_LIMITS,
} from '@/lib/config/constants'
import { optionalUrl } from '@/lib/validations/shared'
import {
  DonationType,
  FieldType,
  RefundPolicyType,
  RegistrationType,
  TournamentFormat,
  TournamentStatus,
} from '@/prisma/generated/prisma/enums'

/** Schema for a single Toornament stage linked to a tournament. */
export const toornamentStageSchema = z.object({
  id: z.uuid('ID de stage invalide.').optional(),
  name: z
    .string()
    .trim()
    .min(1, 'Le nom du stage est requis.')
    .max(
      VALIDATION_LIMITS.STAGE_NAME_MAX,
      `Le nom du stage ne peut pas dépasser ${VALIDATION_LIMITS.STAGE_NAME_MAX} caractères.`,
    ),
  stageId: z
    .string()
    .trim()
    .min(1, "L'ID du stage Toornament est requis.")
    .max(
      VALIDATION_LIMITS.EXTERNAL_ID_MAX,
      `L'ID du stage ne peut pas dépasser ${VALIDATION_LIMITS.EXTERNAL_ID_MAX} caractères.`,
    ),
  number: z.number().int().min(0, "L'ordre doit être positif."),
})

/** Schema for a single dynamic tournament field. */
export const tournamentFieldSchema = z.object({
  id: z.uuid('ID de champ invalide.').optional(),
  label: z
    .string()
    .trim()
    .min(1, 'Le libellé est requis.')
    .max(
      VALIDATION_LIMITS.FIELD_LABEL_MAX,
      `Le libellé ne peut pas dépasser ${VALIDATION_LIMITS.FIELD_LABEL_MAX} caractères.`,
    ),
  type: z.enum([FieldType.TEXT, FieldType.NUMBER], {
    message: 'Le type doit être TEXT ou NUMBER.',
  }),
  required: z.boolean(),
  order: z.number().int().min(0, "L'ordre doit être positif."),
})

/** Base shape shared by create and update tournament schemas. */
const baseTournamentFields = {
  title: z
    .string()
    .trim()
    .min(1, 'Le titre est requis.')
    .max(
      VALIDATION_LIMITS.TITLE_MAX,
      `Le titre ne peut pas dépasser ${VALIDATION_LIMITS.TITLE_MAX} caractères.`,
    ),
  slug: z
    .string()
    .trim()
    .min(1, 'Le slug est requis.')
    .max(
      VALIDATION_LIMITS.SLUG_MAX,
      `Le slug ne peut pas dépasser ${VALIDATION_LIMITS.SLUG_MAX} caractères.`,
    )
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      'Le slug ne peut contenir que des lettres minuscules, chiffres et tirets.',
    ),
  description: z
    .string()
    .trim()
    .min(1, 'La description est requise.')
    .max(
      VALIDATION_LIMITS.DESCRIPTION_MAX,
      `La description ne peut pas dépasser ${VALIDATION_LIMITS.DESCRIPTION_MAX} caractères.`,
    ),
  startDate: z
    .string()
    .min(1, 'La date de début est requise.')
    .refine(v => !Number.isNaN(Date.parse(v)), {
      message: 'Date de début invalide.',
    }),
  endDate: z
    .string()
    .min(1, 'La date de fin est requise.')
    .refine(v => !Number.isNaN(Date.parse(v)), {
      message: 'Date de fin invalide.',
    }),
  registrationOpen: z
    .string()
    .min(1, "La date d'ouverture des inscriptions est requise.")
    .refine(v => !Number.isNaN(Date.parse(v)), {
      message: "Date d'ouverture invalide.",
    }),
  registrationClose: z
    .string()
    .min(1, 'La date de fermeture des inscriptions est requise.')
    .refine(v => !Number.isNaN(Date.parse(v)), {
      message: 'Date de fermeture invalide.',
    }),
  maxTeams: z
    .number()
    .int()
    .min(
      VALIDATION_LIMITS.MAX_TEAMS_MIN,
      `Le nombre maximum doit être au moins ${VALIDATION_LIMITS.MAX_TEAMS_MIN}.`,
    )
    .nullable(),
  format: z.enum([TournamentFormat.SOLO, TournamentFormat.TEAM], {
    message: 'Le format doit être SOLO ou TEAM.',
  }),
  teamSize: z
    .number()
    .int()
    .min(
      VALIDATION_LIMITS.TEAM_SIZE_MIN,
      `La taille doit être au moins ${VALIDATION_LIMITS.TEAM_SIZE_MIN}.`,
    )
    .max(
      VALIDATION_LIMITS.TEAM_SIZE_MAX,
      `La taille ne peut pas dépasser ${VALIDATION_LIMITS.TEAM_SIZE_MAX}.`,
    ),
  games: z
    .array(z.string().trim().min(1))
    .min(1, 'Au moins un jeu est requis.'),
  rules: z
    .string()
    .trim()
    .max(
      VALIDATION_LIMITS.RULES_MAX,
      `Les règles ne peuvent pas dépasser ${VALIDATION_LIMITS.RULES_MAX} caractères.`,
    )
    .optional()
    .default(''),
  prize: z
    .string()
    .trim()
    .max(
      VALIDATION_LIMITS.PRIZE_MAX,
      `Les prix ne peuvent pas dépasser ${VALIDATION_LIMITS.PRIZE_MAX} caractères.`,
    )
    .optional()
    .default(''),
  registrationType: z.enum([RegistrationType.FREE, RegistrationType.PAID], {
    message: "Le type d'inscription doit être FREE ou PAID.",
  }),
  entryFeeAmount: z
    .number()
    .int()
    .min(ENTRY_FEE_MIN_AMOUNT, "Le prix d'entrée doit être d'au moins 1 CHF.")
    .max(
      ENTRY_FEE_MAX_AMOUNT,
      "Le prix d'entrée ne peut pas dépasser " +
        `${ENTRY_FEE_MAX_AMOUNT / CENTIMES_PER_UNIT} CHF.`,
    )
    .nullable(),
  entryFeeCurrency: z.literal('CHF'),
  refundPolicyType: z.enum(
    [RefundPolicyType.NONE, RefundPolicyType.BEFORE_DEADLINE],
    {
      message: 'La politique de remboursement est invalide.',
    },
  ),
  refundDeadlineDays: z
    .number()
    .int()
    .min(
      VALIDATION_LIMITS.REFUND_DEADLINE_MIN_DAYS,
      `Le délai de remboursement doit être d'au moins ${VALIDATION_LIMITS.REFUND_DEADLINE_MIN_DAYS} jour.`,
    )
    .max(
      VALIDATION_LIMITS.REFUND_DEADLINE_MAX_DAYS,
      `Le délai de remboursement ne peut pas dépasser ${VALIDATION_LIMITS.REFUND_DEADLINE_MAX_DAYS} jours.`,
    )
    .nullable(),
  toornamentId: z
    .string()
    .trim()
    .max(
      VALIDATION_LIMITS.EXTERNAL_ID_MAX,
      `L'ID Toornament ne peut pas dépasser ${VALIDATION_LIMITS.EXTERNAL_ID_MAX} caractères.`,
    )
    .optional()
    .default(''),
  imageUrls: z.array(z.url('URL invalide.')).default([]),
  streamUrl: optionalUrl,
  teamLogoEnabled: z.boolean(),
  showRegistrants: z.boolean(),
  donationEnabled: z.boolean().default(false),
  donationType: z
    .enum([DonationType.FIXED, DonationType.FREE], {
      message: 'Le type de don doit être FIXED ou FREE.',
    })
    .nullable()
    .optional(),
  donationFixedAmount: z
    .number()
    .int()
    .min(DONATION_MIN_AMOUNT, "Le montant du don doit être d'au moins 1 CHF.")
    .max(
      DONATION_MAX_AMOUNT,
      `Le montant du don ne peut pas dépasser ${DONATION_MAX_AMOUNT / CENTIMES_PER_UNIT} CHF.`,
    )
    .nullable()
    .optional(),
  donationMinAmount: z
    .number()
    .int()
    .min(
      DONATION_MIN_AMOUNT,
      "Le montant minimum du don doit être d'au moins 1 CHF.",
    )
    .max(
      DONATION_MAX_AMOUNT,
      `Le montant minimum du don ne peut pas dépasser ${DONATION_MAX_AMOUNT / CENTIMES_PER_UNIT} CHF.`,
    )
    .nullable()
    .optional(),
  fields: z.array(tournamentFieldSchema),
  toornamentStages: z.array(toornamentStageSchema),
} as const

/**
 * Shape of the date-related fields accessed inside refinement callbacks.
 * Both create and update schemas include these fields, so this interface is
 * safe to use as the data type in the generic `applyTournamentRefinements` helper.
 */
interface TournamentDateFields {
  startDate: string
  endDate: string
  registrationOpen: string
  registrationClose: string
  registrationType: RegistrationType
  entryFeeAmount: number | null
  refundPolicyType: RefundPolicyType
  refundDeadlineDays: number | null
  toornamentId?: string
  toornamentStages: unknown[]
  donationEnabled: boolean
  donationType?: DonationType | null
  donationFixedAmount?: number | null
  donationMinAmount?: number | null
}

/**
 * Shared refinements applied to both create and update tournament schemas.
 * Extracted to avoid duplicating ~65 lines of .refine() calls.
 *
 * Why the cast exists: Zod's `.refine()` callback receives `output<T>`, which
 * TypeScript widens to `unknown` when `T` is a generic `ZodTypeAny`. This is a
 * known Zod limitation with generic schema helpers (see zod#2474). The cast to
 * `TournamentDateFields` is safe because `applyTournamentRefinements` is only
 * ever called with schemas whose output is a strict superset of that interface
 * (`tournamentBaseSchema` and `updateTournamentSchema` both include every field).
 * A runtime shape-check here would duplicate the Zod schema validation that has
 * already run by the time .refine() executes.
 */
const applyTournamentRefinements = <T extends z.ZodTypeAny>(schema: T) => {
  // Narrowing helper: asserts the refined data contains the date-related fields.
  const d = (data: unknown): TournamentDateFields =>
    data as TournamentDateFields
  return schema
    .refine(data => new Date(d(data).endDate) > new Date(d(data).startDate), {
      message: 'La date de fin doit être après la date de début.',
      path: ['endDate'],
    })
    .refine(
      data =>
        new Date(d(data).registrationClose) >
        new Date(d(data).registrationOpen),
      {
        message: "La fermeture des inscriptions doit être après l'ouverture.",
        path: ['registrationClose'],
      },
    )
    .refine(
      data =>
        new Date(d(data).registrationClose) <= new Date(d(data).startDate),
      {
        message:
          'La fermeture des inscriptions doit être avant ou égale à la date de début.',
        path: ['registrationClose'],
      },
    )
    .refine(
      data =>
        d(data).registrationType === RegistrationType.FREE
          ? d(data).entryFeeAmount === null
          : d(data).entryFeeAmount !== null,
      {
        message: 'Le prix est requis pour un tournoi payant.',
        path: ['entryFeeAmount'],
      },
    )
    .refine(
      data =>
        d(data).registrationType === RegistrationType.FREE
          ? d(data).refundPolicyType === RefundPolicyType.NONE &&
            d(data).refundDeadlineDays === null
          : true,
      {
        message:
          'Les tournois gratuits ne peuvent pas définir de remboursement automatique.',
        path: ['refundPolicyType'],
      },
    )
    .refine(
      data =>
        d(data).refundPolicyType === RefundPolicyType.BEFORE_DEADLINE
          ? d(data).refundDeadlineDays !== null
          : d(data).refundDeadlineDays === null,
      {
        message:
          'Le délai de remboursement est requis uniquement pour une politique avec délai.',
        path: ['refundDeadlineDays'],
      },
    )
    .refine(
      data =>
        d(data).toornamentStages.length === 0 ||
        (d(data).toornamentId !== undefined &&
          d(data).toornamentId?.trim() !== ''),
      {
        message:
          "L'ID Toornament est requis lorsque des stages sont configurés.",
        path: ['toornamentId'],
      },
    )
    .refine(
      data =>
        !d(data).donationEnabled ||
        d(data).registrationType === RegistrationType.PAID,
      {
        message: 'Les dons ne sont disponibles que pour les tournois payants.',
        path: ['donationEnabled'],
      },
    )
    .refine(data => !d(data).donationEnabled || d(data).donationType != null, {
      message: 'Le type de don est requis lorsque les dons sont activés.',
      path: ['donationType'],
    })
    .refine(
      data =>
        !d(data).donationEnabled ||
        d(data).donationType !== DonationType.FIXED ||
        d(data).donationFixedAmount != null,
      {
        message: 'Le montant du don fixe est requis.',
        path: ['donationFixedAmount'],
      },
    )
    .refine(
      data =>
        !d(data).donationEnabled ||
        d(data).donationType !== DonationType.FREE ||
        d(data).donationMinAmount != null,
      {
        message: 'Le montant minimum du don est requis.',
        path: ['donationMinAmount'],
      },
    )
}

/** Internal base object schema (used for type inference in refinements). */
const tournamentBaseSchema = z.object(baseTournamentFields)

/** Schema for creating a tournament. */
export const tournamentSchema = applyTournamentRefinements(tournamentBaseSchema)

/** Schema for deleting a tournament (just the ID). */
export const deleteTournamentSchema = z.object({
  id: z.uuid('ID de tournoi invalide.'),
})

/** Schema for updating a tournament (includes the ID). */
export const updateTournamentSchema = applyTournamentRefinements(
  z.object({
    id: z.uuid('ID de tournoi invalide.'),
    ...baseTournamentFields,
  }),
)

/** Schema for updating a tournament's status. */
export const updateTournamentStatusSchema = z.object({
  id: z.uuid('ID de tournoi invalide.'),
  status: z.enum(
    [
      TournamentStatus.DRAFT,
      TournamentStatus.PUBLISHED,
      TournamentStatus.ARCHIVED,
    ],
    {
      message: 'Le statut doit être DRAFT, PUBLISHED ou ARCHIVED.',
    },
  ),
})
