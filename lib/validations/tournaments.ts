/**
 * File: lib/validations/tournaments.ts
 * Description: Validation schemas for tournament CRUD, registration management, and user registration.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { z } from 'zod'
import {
  fieldValuesSchema,
  optionalUrl,
  returnPathSchema,
} from '@/lib/validations/shared'
import {
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
    .max(30, 'Le nom du stage ne peut pas dépasser 30 caractères.'),
  stageId: z
    .string()
    .trim()
    .min(1, "L'ID du stage Toornament est requis.")
    .max(200, "L'ID du stage ne peut pas dépasser 200 caractères."),
  number: z.number().int().min(0, "L'ordre doit être positif."),
})

/** Schema for a single dynamic tournament field. */
export const tournamentFieldSchema = z.object({
  id: z.uuid('ID de champ invalide.').optional(),
  label: z
    .string()
    .trim()
    .min(1, 'Le libellé est requis.')
    .max(100, 'Le libellé ne peut pas dépasser 100 caractères.'),
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
    .max(200, 'Le titre ne peut pas dépasser 200 caractères.'),
  slug: z
    .string()
    .trim()
    .min(1, 'Le slug est requis.')
    .max(200, 'Le slug ne peut pas dépasser 200 caractères.')
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      'Le slug ne peut contenir que des lettres minuscules, chiffres et tirets.',
    ),
  description: z
    .string()
    .trim()
    .min(1, 'La description est requise.')
    .max(15000, 'La description ne peut pas dépasser 15000 caractères.'),
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
    .min(2, 'Le nombre maximum doit être au moins 2.')
    .nullable(),
  format: z.enum([TournamentFormat.SOLO, TournamentFormat.TEAM], {
    message: 'Le format doit être SOLO ou TEAM.',
  }),
  teamSize: z
    .number()
    .int()
    .min(1, 'La taille doit être au moins 1.')
    .max(20, 'La taille ne peut pas dépasser 20.'),
  game: z
    .string()
    .trim()
    .max(100, 'Le jeu ne peut pas dépasser 100 caractères.')
    .optional()
    .default(''),
  rules: z
    .string()
    .trim()
    .max(30000, 'Les règles ne peuvent pas dépasser 30000 caractères.')
    .optional()
    .default(''),
  prize: z
    .string()
    .trim()
    .max(5000, 'Les prix ne peuvent pas dépasser 5000 caractères.')
    .optional()
    .default(''),
  registrationType: z.enum([RegistrationType.FREE, RegistrationType.PAID], {
    message: 'Le type d\u2019inscription doit être FREE ou PAID.',
  }),
  entryFeeAmount: z
    .number()
    .int()
    .min(100, "Le prix d'entrée doit être d'au moins 1 CHF.")
    .max(100000, "Le prix d'entrée ne peut pas dépasser 1000 CHF.")
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
    .min(1, 'Le délai de remboursement doit être d\u2019au moins 1 jour.')
    .max(90, 'Le délai de remboursement ne peut pas dépasser 90 jours.')
    .nullable(),
  toornamentId: z
    .string()
    .trim()
    .max(200, "L'ID Toornament ne peut pas dépasser 200 caractères.")
    .optional()
    .default(''),
  imageUrls: z.array(z.url('URL invalide.')).default([]),
  streamUrl: optionalUrl,
  fields: z.array(tournamentFieldSchema),
  toornamentStages: z.array(toornamentStageSchema),
} as const

/**
 * Shared refinements applied to both create and update tournament schemas.
 * Extracted to avoid duplicating ~65 lines of .refine() calls.
 */
const applyTournamentRefinements = <T extends z.ZodTypeAny>(schema: T) => {
  // biome-ignore lint/suspicious/noExplicitAny: generic refinement helper — inferred type is safe at call site
  type D = any
  return schema
    .refine((data: D) => new Date(data.endDate) > new Date(data.startDate), {
      message: 'La date de fin doit être après la date de début.',
      path: ['endDate'],
    })
    .refine(
      (data: D) =>
        new Date(data.registrationClose) > new Date(data.registrationOpen),
      {
        message: "La fermeture des inscriptions doit être après l'ouverture.",
        path: ['registrationClose'],
      },
    )
    .refine(
      (data: D) => new Date(data.registrationClose) <= new Date(data.startDate),
      {
        message:
          'La fermeture des inscriptions doit être avant ou égale à la date de début.',
        path: ['registrationClose'],
      },
    )
    .refine(
      (data: D) =>
        data.registrationType === RegistrationType.FREE
          ? data.entryFeeAmount === null
          : data.entryFeeAmount !== null,
      {
        message: 'Le prix est requis pour un tournoi payant.',
        path: ['entryFeeAmount'],
      },
    )
    .refine(
      (data: D) =>
        data.registrationType === RegistrationType.FREE
          ? data.refundPolicyType === RefundPolicyType.NONE &&
            data.refundDeadlineDays === null
          : true,
      {
        message:
          'Les tournois gratuits ne peuvent pas définir de remboursement automatique.',
        path: ['refundPolicyType'],
      },
    )
    .refine(
      (data: D) =>
        data.refundPolicyType === RefundPolicyType.BEFORE_DEADLINE
          ? data.refundDeadlineDays !== null
          : data.refundDeadlineDays === null,
      {
        message:
          'Le délai de remboursement est requis uniquement pour une politique avec délai.',
        path: ['refundDeadlineDays'],
      },
    )
    .refine(
      (data: D) =>
        data.toornamentStages.length === 0 ||
        (data.toornamentId !== undefined && data.toornamentId.trim() !== ''),
      {
        message:
          "L'ID Toornament est requis lorsque des stages sont configurés.",
        path: ['toornamentId'],
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

// ---------------------------------------------------------------------------
// Public registration
// ---------------------------------------------------------------------------

/** Schema for a user registering for a tournament (solo). */
export const registerForTournamentSchema = z.object({
  tournamentId: z.uuid('ID de tournoi invalide.'),
  returnPath: returnPathSchema,
  fieldValues: fieldValuesSchema,
})

/** Schema for a user editing their existing registration field values. */
export const updateRegistrationFieldsSchema = z.object({
  registrationId: z.uuid("ID d'inscription invalide."),
  tournamentId: z.uuid('ID de tournoi invalide.'),
  fieldValues: fieldValuesSchema,
})

// ---------------------------------------------------------------------------
// Team registration (public)
// ---------------------------------------------------------------------------

/** Schema for creating a team and registering as captain. */
export const createTeamSchema = z.object({
  tournamentId: z.uuid('ID de tournoi invalide.'),
  returnPath: returnPathSchema,
  teamName: z
    .string()
    .trim()
    .min(2, "Le nom de l'équipe doit contenir au moins 2 caractères.")
    .max(30, "Le nom de l'équipe ne peut pas dépasser 30 caractères."),
  fieldValues: fieldValuesSchema,
})

/** Schema for joining an existing team and registering. */
export const joinTeamSchema = z.object({
  tournamentId: z.uuid('ID de tournoi invalide.'),
  returnPath: returnPathSchema,
  teamId: z.uuid("ID d'équipe invalide."),
  fieldValues: fieldValuesSchema,
})

// ---------------------------------------------------------------------------
// Player unregistration
// ---------------------------------------------------------------------------

/** Schema for a player cancelling their own registration. */
export const unregisterFromTournamentSchema = z.object({
  tournamentId: z.uuid('ID de tournoi invalide.'),
})

// ---------------------------------------------------------------------------
// Admin team management
// ---------------------------------------------------------------------------

/** Schema for kicking a player from a team. */
export const kickPlayerSchema = z.object({
  tournamentId: z.uuid('ID de tournoi invalide.'),
  teamId: z.uuid("ID d'équipe invalide."),
  userId: z.uuid("ID d'utilisateur invalide."),
})

/** Schema for dissolving a team entirely. */
export const dissolveTeamSchema = z.object({
  tournamentId: z.uuid('ID de tournoi invalide.'),
  teamId: z.uuid("ID d'équipe invalide."),
})

// ---------------------------------------------------------------------------
// Public tournament list filters (URL search params)
// ---------------------------------------------------------------------------

/** Sort options for the public tournament list pages. */
export type TournamentSortOption =
  | 'date_asc'
  | 'date_desc'
  | 'title_asc'
  | 'title_desc'
  | 'registrations_desc'

/** Parsed and validated filters for the public tournament list pages. */
export type PublicTournamentFilters = {
  search: string
  format: TournamentFormat | ''
  type: 'FREE' | 'PAID' | ''
  sort: TournamentSortOption
  page: number
}

/** Parse and validate URL search params for the public tournament list pages.
 *  Falls back to safe defaults for any invalid/missing value. */
export const parsePublicTournamentFilters = (
  params: Record<string, string | string[] | undefined>,
  defaultSort: TournamentSortOption = 'date_asc',
): PublicTournamentFilters => {
  const raw = (key: string) => {
    const v = params[key]
    return typeof v === 'string' ? v.trim() : ''
  }

  const search = raw('search').slice(0, 100)

  const formatRaw = raw('format')
  const format: TournamentFormat | '' =
    formatRaw === TournamentFormat.SOLO || formatRaw === TournamentFormat.TEAM
      ? formatRaw
      : ''

  const typeRaw = raw('type')
  const type: 'FREE' | 'PAID' | '' =
    typeRaw === RegistrationType.FREE || typeRaw === RegistrationType.PAID
      ? typeRaw
      : ''

  const VALID_SORTS: TournamentSortOption[] = [
    'date_asc',
    'date_desc',
    'title_asc',
    'title_desc',
    'registrations_desc',
  ]
  const sortRaw = raw('sort')
  const sort: TournamentSortOption = (
    VALID_SORTS.includes(sortRaw as TournamentSortOption)
      ? sortRaw
      : defaultSort
  ) as TournamentSortOption

  const pageRaw = Number.parseInt(raw('page'), 10)
  const page = Number.isFinite(pageRaw) && pageRaw >= 1 ? pageRaw : 1

  return { search, format, type, sort, page }
}
