/**
 * File: lib/validations/tournament-registration.ts
 * Description: Zod schemas for public and player tournament registration flows:
 *   solo registration, team create/join, unregistration, field updates, team rename,
 *   and admin team management (kick, dissolve).
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { z } from 'zod'
import { VALIDATION_LIMITS } from '@/lib/config/constants'
import { fieldValuesSchema, returnPathSchema } from '@/lib/validations/shared'

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

/** Schema for creating a team and registering as captain. */
export const createTeamSchema = z.object({
  tournamentId: z.uuid('ID de tournoi invalide.'),
  returnPath: returnPathSchema,
  teamName: z
    .string()
    .trim()
    .min(
      VALIDATION_LIMITS.TEAM_NAME_MIN,
      `Le nom de l'équipe doit contenir au moins ${VALIDATION_LIMITS.TEAM_NAME_MIN} caractères.`,
    )
    .max(
      VALIDATION_LIMITS.TEAM_NAME_MAX,
      `Le nom de l'équipe ne peut pas dépasser ${VALIDATION_LIMITS.TEAM_NAME_MAX} caractères.`,
    ),
  fieldValues: fieldValuesSchema,
})

/** Schema for joining an existing team and registering. */
export const joinTeamSchema = z.object({
  tournamentId: z.uuid('ID de tournoi invalide.'),
  returnPath: returnPathSchema,
  teamId: z.uuid("ID d'équipe invalide."),
  fieldValues: fieldValuesSchema,
})

/** Schema for a player cancelling their own registration. */
export const unregisterFromTournamentSchema = z.object({
  tournamentId: z.uuid('ID de tournoi invalide.'),
})

/** Schema for a player cancelling a pending (unpaid) registration checkout. */
export const cancelPendingRegistrationSchema = z.object({
  tournamentId: z.uuid('ID de tournoi invalide.'),
})

/** Schema for a captain updating their team name. */
export const updateTeamNameSchema = z.object({
  teamId: z.uuid("ID d'équipe invalide."),
  name: z
    .string()
    .trim()
    .min(
      VALIDATION_LIMITS.TEAM_NAME_MIN,
      `Le nom d'équipe doit contenir au moins ${VALIDATION_LIMITS.TEAM_NAME_MIN} caractères.`,
    )
    .max(
      VALIDATION_LIMITS.TEAM_NAME_MAX,
      `Le nom d'équipe ne peut pas dépasser ${VALIDATION_LIMITS.TEAM_NAME_MAX} caractères.`,
    ),
})

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
