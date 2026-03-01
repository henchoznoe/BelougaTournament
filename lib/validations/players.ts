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

export type BanPlayerInput = z.infer<typeof banPlayerSchema>

/** Schema for unbanning a player. */
export const unbanPlayerSchema = z.object({
  userId: z.uuid('ID utilisateur invalide.'),
})

export type UnbanPlayerInput = z.infer<typeof unbanPlayerSchema>
