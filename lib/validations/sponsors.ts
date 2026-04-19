/**
 * File: lib/validations/sponsors.ts
 * Description: Validation schemas for sponsor CRUD operations.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { z } from 'zod'
import { VALIDATION_LIMITS } from '@/lib/config/constants'
import { optionalUrl } from '@/lib/validations/shared'

/** Schema for creating or updating a sponsor. */
export const sponsorSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Le nom est requis.')
    .max(
      VALIDATION_LIMITS.SPONSOR_NAME_MAX,
      `Le nom ne peut pas dépasser ${VALIDATION_LIMITS.SPONSOR_NAME_MAX} caractères.`,
    ),
  imageUrls: z
    .array(z.url("URL d'image invalide."))
    .min(1, 'Au moins une image est requise.'),
  url: optionalUrl,
  supportedSince: z.string().date('Date invalide.'),
})

export type SponsorInput = z.infer<typeof sponsorSchema>

/** Schema for deleting a sponsor (just the ID). */
export const deleteSponsorSchema = z.object({
  id: z.uuid('ID de sponsor invalide.'),
})

/** Schema for updating a sponsor (includes the ID). */
export const updateSponsorSchema = sponsorSchema.extend({
  id: z.uuid('ID de sponsor invalide.'),
})

/** Schema for toggling a sponsor's enabled status. */
export const toggleSponsorStatusSchema = z.object({
  id: z.uuid('ID de sponsor invalide.'),
})
