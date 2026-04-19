/**
 * File: lib/validations/users.ts
 * Description: Validation schemas for unified user management operations.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { z } from 'zod'
import { VALIDATION_LIMITS } from '@/lib/config/constants'

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
    .max(
      VALIDATION_LIMITS.DISPLAY_NAME_MAX,
      `Le pseudo ne peut pas dépasser ${VALIDATION_LIMITS.DISPLAY_NAME_MAX} caractères.`,
    )
    .refine(v => v === '' || v.length >= VALIDATION_LIMITS.DISPLAY_NAME_MIN, {
      message: `Le pseudo doit contenir au moins ${VALIDATION_LIMITS.DISPLAY_NAME_MIN} caractères.`,
    }),
})

/** Schema for deleting a user (owner-only, USER-role targets only). */
export const deleteUserSchema = z.object({
  userId: z.uuid('ID utilisateur invalide.'),
})
