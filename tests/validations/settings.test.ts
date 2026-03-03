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
}

const EMPTY_SETTINGS = {
  logoUrl: '',
  twitchUsername: '',
  twitchUrl: '',
  discordUrl: '',
  instagramUrl: '',
  tiktokUrl: '',
  youtubeUrl: '',
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
})
