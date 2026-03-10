/**
 * File: lib/validations/admins.ts
 * Description: Validation schemas for admin management operations.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { z } from 'zod'

/** Schema for promoting a user to ADMIN. */
export const promoteAdminSchema = z.object({
  userId: z.uuid('ID utilisateur invalide.'),
})

/** Schema for demoting an admin back to USER. */
export const demoteAdminSchema = z.object({
  userId: z.uuid('ID utilisateur invalide.'),
})

/** Schema for updating an admin's tournament assignments. */
export const updateAssignmentsSchema = z.object({
  userId: z.uuid('ID utilisateur invalide.'),
  tournamentIds: z.array(z.uuid('ID tournoi invalide.')),
})

/** Schema for updating an admin's display name and tournament assignments. */
export const updateAdminSchema = z.object({
  userId: z.uuid('ID utilisateur invalide.'),
  displayName: z
    .string()
    .trim()
    .min(2, 'Le pseudo doit contenir au moins 2 caractères.')
    .max(32, 'Le pseudo ne peut pas dépasser 32 caractères.'),
  tournamentIds: z.array(z.uuid('ID tournoi invalide.')),
})
