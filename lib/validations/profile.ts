/**
 * File: lib/validations/profile.ts
 * Description: Validation schema for user profile editing.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { z } from 'zod'

export const profileSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(2, "Le nom d'affichage doit contenir au moins 2 caractères.")
    .max(32, "Le nom d'affichage ne peut pas dépasser 32 caractères."),
})

export type ProfileInput = z.infer<typeof profileSchema>
