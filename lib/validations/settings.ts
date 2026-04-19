/**
 * File: lib/validations/settings.ts
 * Description: Validation schema for global application settings.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { z } from 'zod'
import {
  TWITCH_USERNAME_MAX_LENGTH,
  VALIDATION_LIMITS,
} from '@/lib/config/constants'
import { optionalUrl } from '@/lib/validations/shared'

/** Optional trimmed text field with a max length. */
const optionalText = (max: number) => z.string().trim().max(max)

/** Matches the Prisma GlobalSettings model fields exactly. */
export const settingsSchema = z.object({
  logoUrl: optionalUrl,
  twitchUsername: z.string().trim().max(TWITCH_USERNAME_MAX_LENGTH),
  twitchUrl: optionalUrl,
  discordUrl: optionalUrl,
  instagramUrl: optionalUrl,
  tiktokUrl: optionalUrl,
  youtubeUrl: optionalUrl,
  feature1Title: optionalText(VALIDATION_LIMITS.FEATURE_TITLE_MAX),
  feature1Description: optionalText(VALIDATION_LIMITS.FEATURE_DESCRIPTION_MAX),
  feature2Title: optionalText(VALIDATION_LIMITS.FEATURE_TITLE_MAX),
  feature2Description: optionalText(VALIDATION_LIMITS.FEATURE_DESCRIPTION_MAX),
  feature3Title: optionalText(VALIDATION_LIMITS.FEATURE_TITLE_MAX),
  feature3Description: optionalText(VALIDATION_LIMITS.FEATURE_DESCRIPTION_MAX),
})

export type SettingsInput = z.infer<typeof settingsSchema>
