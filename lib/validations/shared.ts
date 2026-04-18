/**
 * File: lib/validations/shared.ts
 * Description: Shared Zod schema utilities used across multiple validation modules.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { z } from 'zod'

/** Accepts an empty string (field cleared) or a valid URL starting with http(s)://. */
export const optionalUrl = z
  .string()
  .trim()
  .refine(val => !val || /^https?:\/\/.+/.test(val), {
    message: 'URL invalide (doit commencer par https://)',
  })

/** Application-relative return path (must start with / but not //). */
export const returnPathSchema = z
  .string()
  .trim()
  .min(1, 'Le chemin de retour est requis.')
  .startsWith('/', 'Le chemin de retour doit commencer par /.')
  .max(500, 'Le chemin de retour est trop long.')
  .refine(val => !val.startsWith('//'), {
    message: 'Le chemin de retour est invalide.',
  })

/** Dynamic field values JSON map (string keys, string or number values). */
export const fieldValuesSchema = z.record(
  z.string(),
  z.union([z.string(), z.number()]),
)
