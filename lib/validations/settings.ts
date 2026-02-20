/**
 * File: lib/validations/settings.ts
 * Description: Validation schemas for global application settings
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { z } from 'zod'

/** Optional URL-or-empty string for social links and asset URLs. */
const optionalUrl = z.string().optional().or(z.literal(''))

/** Matches the GlobalSettings model: socials stored as JSON + streamUrl + logoUrl. */
export const settingsSchema = z.object({
  logoUrl: optionalUrl,
  streamUrl: optionalUrl,
  socialDiscord: optionalUrl,
  socialTwitch: optionalUrl,
  socialTiktok: optionalUrl,
  socialInstagram: optionalUrl,
  socialYoutube: optionalUrl,
})

export type SettingsInput = z.infer<typeof settingsSchema>
