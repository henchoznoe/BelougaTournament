/**
 * File: lib/validations/settings.ts
 * Description: Validation schema for global application settings.
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

/** Matches the Prisma GlobalSettings model fields exactly. */
export const settingsSchema = z.object({
  logoUrl: optionalUrl,
  twitchUsername: z.string().trim(),
  twitchUrl: optionalUrl,
  discordUrl: optionalUrl,
  instagramUrl: optionalUrl,
  tiktokUrl: optionalUrl,
  youtubeUrl: optionalUrl,
})

export type SettingsInput = z.infer<typeof settingsSchema>
