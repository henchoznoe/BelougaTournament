/**
 * File: lib/actions/settings.ts
 * Description: Server actions for updating site settings.
 */

'use server'

import { put } from '@vercel/blob'
import { revalidatePath } from 'next/cache'
import prisma from '@/lib/core/db'
import { fr } from '@/lib/i18n/dictionaries/fr'
import { settingsSchema } from '@/lib/validations/settings'

// ----------------------------------------------------------------------
// TYPES
// ----------------------------------------------------------------------

export type SettingsState = {
  message: string
  errors?: Record<string, string[]>
  success?: boolean
}

// ----------------------------------------------------------------------
// CONSTANTS
// ----------------------------------------------------------------------

const DB_CONFIG = {
  SINGLETON_ID: 1,
} as const

const FORM_KEYS = {
  LOGO_FILE: 'logo',
  LOGO_URL: 'logoUrl',
} as const

// ----------------------------------------------------------------------
// LOGIC
// ----------------------------------------------------------------------

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
    return {
      success: false,
      message: fr.common.server.actions.settings.uploadError,
    }
  }
  const rawData = extractSettingsData(formData, logoUrl)
  const validatedFields = settingsSchema.safeParse(rawData)

  if (!validatedFields.success) {
    return {
      success: false,
      message: fr.common.server.actions.settings.validationError,
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

    revalidatePath('/', 'layout')

    return { success: true, message: fr.common.server.actions.settings.success }
  } catch (error) {
    console.error('Settings update error:', error)
    return {
      success: false,
      message: fr.common.server.actions.settings.dbError,
    }
  }
}
