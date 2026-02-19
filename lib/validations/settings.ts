/**
 * File: lib/validations/settings.ts
 * Description: Validation schemas for settings
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { z } from 'zod'

const settingString = z.string().optional().or(z.literal(''))

export const settingsSchema = z.object({
  logoUrl: settingString,
  socialDiscord: settingString,
  socialTwitch: settingString,
  socialTiktok: settingString,
  socialInstagram: settingString,
  socialYoutube: settingString,
})

export type SettingsInput = z.infer<typeof settingsSchema>
