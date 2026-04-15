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

/** Schema for updating a user display name. */
export const updateUserSchema = z.object({
  userId: z.uuid('ID utilisateur invalide.'),
  displayName: z
    .string()
    .trim()
    .max(32, 'Le pseudo ne peut pas dépasser 32 caractères.')
    .refine(v => v === '' || v.length >= 2, {
      message: 'Le pseudo doit contenir au moins 2 caractères.',
    }),
})

/** Schema for banning a user. */
export const banUserSchema = z.object({
  userId: z.uuid('ID utilisateur invalide.'),
  bannedUntil: z.coerce
    .date({ message: 'Date de ban invalide.' })
    .refine(d => d > new Date(), {
      message: 'La date de ban doit être dans le futur.',
    }),
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

/** Schema for deleting a user (owner-only, USER-role targets only). */
export const deleteUserSchema = z.object({
  userId: z.uuid('ID utilisateur invalide.'),
})
