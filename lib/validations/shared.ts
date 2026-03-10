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
