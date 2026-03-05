/**
 * File: lib/validations/tournaments.ts
 * Description: Validation schemas for tournament CRUD, registration management, and user registration.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { z } from 'zod'

/** Accepts an empty string (field cleared) or a valid URL. */
const optionalUrl = z
  .string()
  .trim()
  .refine(val => !val || /^https?:\/\/.+/.test(val), {
    message: 'URL invalide (doit commencer par https://)',
  })

/** Schema for a single dynamic tournament field. */
export const tournamentFieldSchema = z.object({
  id: z.uuid('ID de champ invalide.').optional(),
  label: z
    .string()
    .trim()
    .min(1, 'Le libellé est requis.')
    .max(100, 'Le libellé ne peut pas dépasser 100 caractères.'),
  type: z.enum(['TEXT', 'NUMBER'], {
    message: 'Le type doit être TEXT ou NUMBER.',
  }),
  required: z.boolean(),
  order: z.number().int().min(0, "L'ordre doit être positif."),
})

export type TournamentFieldInput = z.infer<typeof tournamentFieldSchema>

/** Schema for creating a tournament. */
export const tournamentSchema = z
  .object({
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
      .max(5000, 'La description ne peut pas dépasser 5000 caractères.'),
    startDate: z.string().datetime({ message: 'Date de début invalide.' }),
    endDate: z.string().datetime({ message: 'Date de fin invalide.' }),
    registrationOpen: z.string().datetime({
      message: "Date d'ouverture des inscriptions invalide.",
    }),
    registrationClose: z.string().datetime({
      message: 'Date de fermeture des inscriptions invalide.',
    }),
    maxTeams: z
      .number()
      .int()
      .min(2, 'Le nombre maximum doit être au moins 2.')
      .nullable(),
    format: z.enum(['SOLO', 'TEAM'], {
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
    imageUrl: optionalUrl,
    rules: z
      .string()
      .trim()
      .max(10000, 'Les règles ne peuvent pas dépasser 10000 caractères.')
      .optional()
      .default(''),
    prize: z
      .string()
      .trim()
      .max(500, 'Les prix ne peuvent pas dépasser 500 caractères.')
      .optional()
      .default(''),
    toornamentId: z
      .string()
      .trim()
      .max(200, "L'ID Toornament ne peut pas dépasser 200 caractères.")
      .optional()
      .default(''),
    streamUrl: optionalUrl,
    autoApprove: z.boolean(),
    fields: z.array(tournamentFieldSchema),
  })
  .refine(data => new Date(data.endDate) > new Date(data.startDate), {
    message: 'La date de fin doit être après la date de début.',
    path: ['endDate'],
  })
  .refine(
    data => new Date(data.registrationClose) > new Date(data.registrationOpen),
    {
      message: "La fermeture des inscriptions doit être après l'ouverture.",
      path: ['registrationClose'],
    },
  )
  .refine(
    data => new Date(data.registrationClose) <= new Date(data.startDate),
    {
      message:
        'La fermeture des inscriptions doit être avant ou égale à la date de début.',
      path: ['registrationClose'],
    },
  )

export type TournamentInput = z.infer<typeof tournamentSchema>

/** Form-level input type (before Zod defaults are applied). */
export type TournamentFormInput = z.input<typeof tournamentSchema>

/** Schema for deleting a tournament (just the ID). */
export const deleteTournamentSchema = z.object({
  id: z.uuid('ID de tournoi invalide.'),
})

export type DeleteTournamentInput = z.infer<typeof deleteTournamentSchema>

/** Schema for updating a tournament (includes the ID). */
export const updateTournamentSchema = z
  .object({
    id: z.uuid('ID de tournoi invalide.'),
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
      .max(5000, 'La description ne peut pas dépasser 5000 caractères.'),
    startDate: z.string().datetime({ message: 'Date de début invalide.' }),
    endDate: z.string().datetime({ message: 'Date de fin invalide.' }),
    registrationOpen: z.string().datetime({
      message: "Date d'ouverture des inscriptions invalide.",
    }),
    registrationClose: z.string().datetime({
      message: 'Date de fermeture des inscriptions invalide.',
    }),
    maxTeams: z
      .number()
      .int()
      .min(2, 'Le nombre maximum doit être au moins 2.')
      .nullable(),
    format: z.enum(['SOLO', 'TEAM'], {
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
    imageUrl: optionalUrl,
    rules: z
      .string()
      .trim()
      .max(10000, 'Les règles ne peuvent pas dépasser 10000 caractères.')
      .optional()
      .default(''),
    prize: z
      .string()
      .trim()
      .max(500, 'Les prix ne peuvent pas dépasser 500 caractères.')
      .optional()
      .default(''),
    toornamentId: z
      .string()
      .trim()
      .max(200, "L'ID Toornament ne peut pas dépasser 200 caractères.")
      .optional()
      .default(''),
    streamUrl: optionalUrl,
    autoApprove: z.boolean(),
    fields: z.array(tournamentFieldSchema),
  })
  .refine(data => new Date(data.endDate) > new Date(data.startDate), {
    message: 'La date de fin doit être après la date de début.',
    path: ['endDate'],
  })
  .refine(
    data => new Date(data.registrationClose) > new Date(data.registrationOpen),
    {
      message: "La fermeture des inscriptions doit être après l'ouverture.",
      path: ['registrationClose'],
    },
  )
  .refine(
    data => new Date(data.registrationClose) <= new Date(data.startDate),
    {
      message:
        'La fermeture des inscriptions doit être avant ou égale à la date de début.',
      path: ['registrationClose'],
    },
  )

export type UpdateTournamentInput = z.infer<typeof updateTournamentSchema>

/** Schema for updating a tournament's status. */
export const updateTournamentStatusSchema = z.object({
  id: z.uuid('ID de tournoi invalide.'),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED'], {
    message: 'Le statut doit être DRAFT, PUBLISHED ou ARCHIVED.',
  }),
})

export type UpdateTournamentStatusInput = z.infer<
  typeof updateTournamentStatusSchema
>

/** Schema for updating a registration's status (approve / reject / waitlist). */
export const updateRegistrationStatusSchema = z.object({
  id: z.uuid("ID d'inscription invalide."),
  tournamentId: z.uuid('ID de tournoi invalide.'),
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'WAITLIST'], {
    message: 'Le statut doit être PENDING, APPROVED, REJECTED ou WAITLIST.',
  }),
})

export type UpdateRegistrationStatusInput = z.infer<
  typeof updateRegistrationStatusSchema
>

// ---------------------------------------------------------------------------
// Public registration
// ---------------------------------------------------------------------------

/** Schema for a user registering for a tournament (solo). */
export const registerForTournamentSchema = z.object({
  tournamentId: z.uuid('ID de tournoi invalide.'),
  fieldValues: z.record(z.string(), z.union([z.string(), z.number()])),
})

export type RegisterForTournamentInput = z.infer<
  typeof registerForTournamentSchema
>

/** Schema for a user editing their existing registration field values. */
export const updateRegistrationFieldsSchema = z.object({
  registrationId: z.uuid("ID d'inscription invalide."),
  tournamentId: z.uuid('ID de tournoi invalide.'),
  fieldValues: z.record(z.string(), z.union([z.string(), z.number()])),
})

export type UpdateRegistrationFieldsInput = z.infer<
  typeof updateRegistrationFieldsSchema
>

// ---------------------------------------------------------------------------
// Team registration (public)
// ---------------------------------------------------------------------------

/** Schema for creating a team and registering as captain. */
export const createTeamSchema = z.object({
  tournamentId: z.uuid('ID de tournoi invalide.'),
  teamName: z
    .string()
    .trim()
    .min(2, "Le nom de l'équipe doit contenir au moins 2 caractères.")
    .max(30, "Le nom de l'équipe ne peut pas dépasser 30 caractères."),
  fieldValues: z.record(z.string(), z.union([z.string(), z.number()])),
})

export type CreateTeamInput = z.infer<typeof createTeamSchema>

/** Schema for joining an existing team and registering. */
export const joinTeamSchema = z.object({
  tournamentId: z.uuid('ID de tournoi invalide.'),
  teamId: z.uuid("ID d'équipe invalide."),
  fieldValues: z.record(z.string(), z.union([z.string(), z.number()])),
})

export type JoinTeamInput = z.infer<typeof joinTeamSchema>
