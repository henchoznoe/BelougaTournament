/**
 * File: lib/validations/users.ts
 * Description: Validation schemas for unified user management operations.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { z } from 'zod'

/** Schema for promoting a user to ADMIN. */
export const promoteUserSchema = z.object({
  userId: z.uuid('ID utilisateur invalide.'),
})

/** Schema for demoting an admin back to USER. */
export const demoteUserSchema = z.object({
  userId: z.uuid('ID utilisateur invalide.'),
})

/** Schema for updating an admin's tournament assignments. */
export const updateAssignmentsSchema = z.object({
  userId: z.uuid('ID utilisateur invalide.'),
  tournamentIds: z.array(z.uuid('ID tournoi invalide.')),
})

/** Schema for updating a user (admin: displayName + assignments, player: displayName only). */
export const updateUserSchema = z.object({
  userId: z.uuid('ID utilisateur invalide.'),
  displayName: z
    .string()
    .trim()
    .min(2, 'Le pseudo doit contenir au moins 2 caractères.')
    .max(32, 'Le pseudo ne peut pas dépasser 32 caractères.'),
  tournamentIds: z.array(z.uuid('ID tournoi invalide.')).optional(),
})

/** Schema for banning a user. */
export const banUserSchema = z.object({
  userId: z.uuid('ID utilisateur invalide.'),
  bannedUntil: z.coerce.date({ message: 'Date de ban invalide.' }),
  banReason: z
    .string()
    .trim()
    .max(500, 'La raison ne peut pas dépasser 500 caractères.')
    .optional(),
})

/** Schema for unbanning a user. */
export const unbanUserSchema = z.object({
  userId: z.uuid('ID utilisateur invalide.'),
})

/** Schema for deleting a user (SUPERADMIN only, USER-role targets only). */
export const deleteUserSchema = z.object({
  userId: z.uuid('ID utilisateur invalide.'),
})
