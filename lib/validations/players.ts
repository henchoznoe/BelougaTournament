/**
 * File: lib/validations/players.ts
 * Description: Validation schemas for player management operations.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { z } from 'zod'

/** Schema for banning a player. */
export const banPlayerSchema = z.object({
  userId: z.uuid('ID utilisateur invalide.'),
  bannedUntil: z.coerce.date({ message: 'Date de ban invalide.' }),
  banReason: z
    .string()
    .trim()
    .max(500, 'La raison ne peut pas dépasser 500 caractères.')
    .optional(),
})

/** Schema for unbanning a player. */
export const unbanPlayerSchema = z.object({
  userId: z.uuid('ID utilisateur invalide.'),
})

/** Schema for updating a player's display name. */
export const updatePlayerSchema = z.object({
  userId: z.uuid('ID utilisateur invalide.'),
  displayName: z
    .string()
    .trim()
    .min(2, 'Le pseudo doit contenir au moins 2 caractères.')
    .max(32, 'Le pseudo ne peut pas dépasser 32 caractères.'),
})
