/**
 * File: lib/validations/settings.ts
 * Description: Validation schemas for global site settings.
 * Author: Noé Henchoz
 * Date: 2025-12-07
 * License: MIT
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
  statsYears: settingString,
  statsPlayers: settingString,
  statsTournaments: settingString,
  statsMatches: settingString,
})

export type SettingsInput = z.infer<typeof settingsSchema>
