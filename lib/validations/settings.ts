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

/** Optional trimmed text field with a max length. */
const optionalText = (max: number) => z.string().trim().max(max)

/** Matches the Prisma GlobalSettings model fields exactly. */
export const settingsSchema = z.object({
  logoUrl: optionalUrl,
  twitchUsername: z.string().trim(),
  twitchUrl: optionalUrl,
  discordUrl: optionalUrl,
  instagramUrl: optionalUrl,
  tiktokUrl: optionalUrl,
  youtubeUrl: optionalUrl,
  feature1Title: optionalText(50),
  feature1Description: optionalText(200),
  feature2Title: optionalText(50),
  feature2Description: optionalText(200),
  feature3Title: optionalText(50),
  feature3Description: optionalText(200),
})

export type SettingsInput = z.infer<typeof settingsSchema>
