/**
 * File: lib/validations/sponsors.ts
 * Description: Validation schemas for sponsor CRUD operations.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { z } from 'zod'

/** Accepts an empty string (field cleared) or a valid URL. */
const optionalUrl = z
  .string()
  .trim()
  .refine(val => !val || /^https?:\/\/.+/.test(val), {
    message: 'URL invalide (doit commencer par https://)',
  })

/** Schema for creating or updating a sponsor. */
export const sponsorSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Le nom est requis.')
    .max(100, 'Le nom ne peut pas dépasser 100 caractères.'),
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

export type DeleteSponsorInput = z.infer<typeof deleteSponsorSchema>

/** Schema for updating a sponsor (includes the ID). */
export const updateSponsorSchema = sponsorSchema.extend({
  id: z.uuid('ID de sponsor invalide.'),
})

export type UpdateSponsorInput = z.infer<typeof updateSponsorSchema>
