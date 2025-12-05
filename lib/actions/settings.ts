/**
 * File: lib/actions/settings.ts
 * Description: Server actions for updating site settings.
 * Author: Noé Henchoz
 * Date: 2025-12-02
 * License: MIT
 */

'use server'

import { put } from '@vercel/blob'
import { revalidateTag } from 'next/cache'
import { z } from 'zod'
import prisma from '@/lib/prisma'

// Types
const settingString = z.string().optional().or(z.literal(''))

const settingsSchema = z.object({
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

export type SettingsState = {
  message: string
  errors?: Record<string, string[]>
  success?: boolean
}

// Constants
const DB_CONFIG = {
  SINGLETON_ID: 1,
} as const

const CACHE_TAGS = {
  SETTINGS: 'site-settings',
} as const

const FORM_KEYS = {
  LOGO_FILE: 'logo',
  LOGO_URL: 'logoUrl',
} as const

const MESSAGES = {
  SUCCESS: 'Settings updated successfully.',
  ERR_UPLOAD: 'Failed to upload logo file.',
  ERR_VALIDATION: 'Invalid form data. Please check your inputs.',
  ERR_DB: 'Database error: Failed to save settings.',
} as const

const uploadLogoIfNeeded = async (
  formData: FormData,
  existingUrl: string,
): Promise<string> => {
  const logoFile = formData.get(FORM_KEYS.LOGO_FILE) as File | null

  // If no file or empty file, return existing URL
  if (!logoFile || logoFile.size === 0) {
    return existingUrl
  }

  // Upload to Vercel Blob
  const blob = await put(logoFile.name, logoFile, {
    access: 'public',
    allowOverwrite: true,
  })

  return blob.url
}

const extractSettingsData = (formData: FormData, finalLogoUrl: string) => {
  return {
    logoUrl: finalLogoUrl,
    socialDiscord: formData.get('socialDiscord'),
    socialTwitch: formData.get('socialTwitch'),
    socialTiktok: formData.get('socialTiktok'),
    socialInstagram: formData.get('socialInstagram'),
    socialYoutube: formData.get('socialYoutube'),
    statsYears: formData.get('statsYears'),
    statsPlayers: formData.get('statsPlayers'),
    statsTournaments: formData.get('statsTournaments'),
    statsMatches: formData.get('statsMatches'),
  }
}

export const updateSettings = async (
  _prevState: unknown,
  formData: FormData,
): Promise<SettingsState> => {
  let logoUrl = (formData.get(FORM_KEYS.LOGO_URL) as string) || ''

  try {
    logoUrl = await uploadLogoIfNeeded(formData, logoUrl)
  } catch (error) {
    console.error('Blob upload error:', error)
    return { success: false, message: MESSAGES.ERR_UPLOAD }
  }
  const rawData = extractSettingsData(formData, logoUrl)
  const validatedFields = settingsSchema.safeParse(rawData)

  if (!validatedFields.success) {
    return {
      success: false,
      message: MESSAGES.ERR_VALIDATION,
      errors: validatedFields.error.flatten().fieldErrors,
    }
  }

  try {
    await prisma.siteSettings.upsert({
      where: { id: DB_CONFIG.SINGLETON_ID },
      update: validatedFields.data,
      create: {
        id: DB_CONFIG.SINGLETON_ID,
        ...validatedFields.data,
      },
    })

    revalidateTag(CACHE_TAGS.SETTINGS, 'default')

    return { success: true, message: MESSAGES.SUCCESS }
  } catch (error) {
    console.error('Settings update error:', error)
    return { success: false, message: MESSAGES.ERR_DB }
  }
}
