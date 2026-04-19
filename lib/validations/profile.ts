/**
 * File: lib/validations/profile.ts
 * Description: Validation schema for user profile editing.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { z } from 'zod'
import { VALIDATION_LIMITS } from '@/lib/config/constants'

export const profileSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(
      VALIDATION_LIMITS.DISPLAY_NAME_MIN,
      `Le nom d'affichage doit contenir au moins ${VALIDATION_LIMITS.DISPLAY_NAME_MIN} caractères.`,
    )
    .max(
      VALIDATION_LIMITS.DISPLAY_NAME_MAX,
      `Le nom d'affichage ne peut pas dépasser ${VALIDATION_LIMITS.DISPLAY_NAME_MAX} caractères.`,
    ),
})

export type ProfileInput = z.infer<typeof profileSchema>
