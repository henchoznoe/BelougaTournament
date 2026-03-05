/**
 * File: tests/validations/settings.test.ts
 * Description: Unit tests for the global settings Zod validation schema.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { describe, expect, it } from 'vitest'
import { settingsSchema } from '@/lib/validations/settings'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const VALID_SETTINGS = {
  logoUrl: 'https://example.com/logo.png',
  twitchUsername: 'belougagg',
  twitchUrl: 'https://twitch.tv/belougagg',
  discordUrl: 'https://discord.gg/belouga',
  instagramUrl: 'https://instagram.com/belouga',
  tiktokUrl: 'https://tiktok.com/@belouga',
  youtubeUrl: 'https://youtube.com/@belouga',
  feature1Title: 'Matchmaking Équitable',
  feature1Description: 'Affrontez des joueurs de votre niveau.',
  feature2Title: 'Format Compétitif',
  feature2Description: 'Arbre de tournoi professionnel.',
  feature3Title: 'Diffusion en Direct',
  feature3Description: 'Les phases finales sont diffusées sur Twitch.',
}

const EMPTY_SETTINGS = {
  logoUrl: '',
  twitchUsername: '',
  twitchUrl: '',
  discordUrl: '',
  instagramUrl: '',
  tiktokUrl: '',
  youtubeUrl: '',
  feature1Title: '',
  feature1Description: '',
  feature2Title: '',
  feature2Description: '',
  feature3Title: '',
  feature3Description: '',
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('settingsSchema', () => {
  it('accepts all valid URLs', () => {
    expect(settingsSchema.safeParse(VALID_SETTINGS).success).toBe(true)
  })

  it('accepts all empty strings (fields cleared)', () => {
    expect(settingsSchema.safeParse(EMPTY_SETTINGS).success).toBe(true)
  })

  it('accepts a mix of empty and valid URL fields', () => {
    const result = settingsSchema.safeParse({
      ...EMPTY_SETTINGS,
      twitchUrl: 'https://twitch.tv/belougagg',
      twitchUsername: 'belougagg',
    })
    expect(result.success).toBe(true)
  })

  it('rejects a URL that does not start with https://', () => {
    const result = settingsSchema.safeParse({
      ...EMPTY_SETTINGS,
      twitchUrl: 'ftp://invalid.com',
    })
    expect(result.success).toBe(false)
  })

  it('accepts a URL that starts with http://', () => {
    const result = settingsSchema.safeParse({
      ...EMPTY_SETTINGS,
      discordUrl: 'http://discord.gg/belouga',
    })
    expect(result.success).toBe(true)
  })

  it('rejects a plain string that is not a URL', () => {
    const result = settingsSchema.safeParse({
      ...EMPTY_SETTINGS,
      logoUrl: 'not-a-url',
    })
    expect(result.success).toBe(false)
  })

  it('trims whitespace from twitchUsername', () => {
    const result = settingsSchema.safeParse({
      ...EMPTY_SETTINGS,
      twitchUsername: '  belougagg  ',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.twitchUsername).toBe('belougagg')
    }
  })

  it('rejects missing required fields', () => {
    expect(settingsSchema.safeParse({}).success).toBe(false)
  })

  it('accepts valid feature titles and descriptions', () => {
    const result = settingsSchema.safeParse(VALID_SETTINGS)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.feature1Title).toBe('Matchmaking Équitable')
      expect(result.data.feature2Title).toBe('Format Compétitif')
      expect(result.data.feature3Title).toBe('Diffusion en Direct')
    }
  })

  it('accepts empty feature titles and descriptions (fallback to defaults)', () => {
    const result = settingsSchema.safeParse(EMPTY_SETTINGS)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.feature1Title).toBe('')
      expect(result.data.feature1Description).toBe('')
    }
  })

  it('rejects a feature title exceeding 50 characters', () => {
    const result = settingsSchema.safeParse({
      ...EMPTY_SETTINGS,
      feature1Title: 'A'.repeat(51),
    })
    expect(result.success).toBe(false)
  })

  it('rejects a feature description exceeding 200 characters', () => {
    const result = settingsSchema.safeParse({
      ...EMPTY_SETTINGS,
      feature2Description: 'A'.repeat(201),
    })
    expect(result.success).toBe(false)
  })

  it('trims whitespace from feature fields', () => {
    const result = settingsSchema.safeParse({
      ...EMPTY_SETTINGS,
      feature3Title: '  Diffusion en Direct  ',
      feature3Description: '  Les phases finales.  ',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.feature3Title).toBe('Diffusion en Direct')
      expect(result.data.feature3Description).toBe('Les phases finales.')
    }
  })
})
