/**
 * File: tests/config/constants.test.ts
 * Description: Unit tests for global constants.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { describe, expect, it } from 'vitest'
import {
  AUTH_CONFIG,
  CACHE_TAGS,
  DEFAULT_ASSETS,
  DISCORD,
  METADATA,
  NOON_UTC_SUFFIX,
  SEARCH_CONFIG,
  SETTINGS_SINGLETON_ID,
  TOURNAMENT_STATUS_LABELS,
  TOURNAMENT_STATUS_STYLES,
  TWITCH_USERNAME_MAX_LENGTH,
} from '@/lib/config/constants'
import { TournamentStatus } from '@/prisma/generated/prisma/enums'

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('METADATA', () => {
  it('has a name', () => {
    expect(METADATA.NAME).toBe('Belouga Tournament')
  })

  it('has a template title containing %s placeholder', () => {
    expect(METADATA.TEMPLATE_TITLE).toContain('%s')
  })
})

describe('DEFAULT_ASSETS', () => {
  it('defines LOGO and BG_IMAGE paths', () => {
    expect(DEFAULT_ASSETS.LOGO).toBe('/assets/logo-blue.png')
    expect(DEFAULT_ASSETS.BG_IMAGE).toBe('/assets/wall.png')
  })
})

describe('SETTINGS_SINGLETON_ID', () => {
  it('is 1', () => {
    expect(SETTINGS_SINGLETON_ID).toBe(1)
  })
})

describe('DISCORD', () => {
  it('has the users/@me API URL', () => {
    expect(DISCORD.API_USER_URL).toBe('https://discord.com/api/users/@me')
  })

  it('builds avatar CDN URL with userId and avatarHash', () => {
    const url = DISCORD.AVATAR_CDN_URL('123', 'abc')
    expect(url).toBe('https://cdn.discordapp.com/avatars/123/abc.png')
  })
})

describe('AUTH_CONFIG', () => {
  it('SESSION_EXPIRES_IN is 7 days in seconds', () => {
    expect(AUTH_CONFIG.SESSION_EXPIRES_IN).toBe(60 * 60 * 24 * 7)
  })

  it('SESSION_UPDATE_AGE is 24 hours in seconds', () => {
    expect(AUTH_CONFIG.SESSION_UPDATE_AGE).toBe(60 * 60 * 24)
  })

  it('COOKIE_CACHE_MAX_AGE is 5 minutes in seconds', () => {
    expect(AUTH_CONFIG.COOKIE_CACHE_MAX_AGE).toBe(5 * 60)
  })

  it('RATE_LIMIT_WINDOW is 60 seconds', () => {
    expect(AUTH_CONFIG.RATE_LIMIT_WINDOW).toBe(60)
  })

  it('RATE_LIMIT_MAX is 30', () => {
    expect(AUTH_CONFIG.RATE_LIMIT_MAX).toBe(30)
  })
})

describe('NOON_UTC_SUFFIX', () => {
  it('is a valid ISO time suffix at noon UTC', () => {
    expect(NOON_UTC_SUFFIX).toBe('T12:00:00.000Z')
    const date = new Date(`2026-01-15${NOON_UTC_SUFFIX}`)
    expect(date.getUTCHours()).toBe(12)
  })
})

describe('SEARCH_CONFIG', () => {
  it('defines MIN_QUERY_LENGTH and MAX_RESULTS', () => {
    expect(SEARCH_CONFIG.MIN_QUERY_LENGTH).toBe(2)
    expect(SEARCH_CONFIG.MAX_RESULTS).toBe(10)
  })
})

describe('TWITCH_USERNAME_MAX_LENGTH', () => {
  it('is 25', () => {
    expect(TWITCH_USERNAME_MAX_LENGTH).toBe(25)
  })
})

describe('TOURNAMENT_STATUS_LABELS', () => {
  it('has a label for every TournamentStatus', () => {
    for (const status of Object.values(TournamentStatus)) {
      expect(TOURNAMENT_STATUS_LABELS[status]).toBeTypeOf('string')
    }
  })
})

describe('TOURNAMENT_STATUS_STYLES', () => {
  it('has a style for every TournamentStatus', () => {
    for (const status of Object.values(TournamentStatus)) {
      expect(TOURNAMENT_STATUS_STYLES[status]).toBeTypeOf('string')
    }
  })
})

describe('CACHE_TAGS', () => {
  it('defines expected tag keys', () => {
    const expectedKeys = [
      'DASHBOARD_STATS',
      'DASHBOARD_PAYMENTS',
      'DASHBOARD_REGISTRATIONS',
      'DASHBOARD_RECENT_USERS',
      'SETTINGS',
      'SPONSORS',
      'TOURNAMENTS',
      'USERS',
    ]
    for (const key of expectedKeys) {
      expect(CACHE_TAGS).toHaveProperty(key)
    }
  })

  it('all values are non-empty strings', () => {
    for (const value of Object.values(CACHE_TAGS)) {
      expect(value).toBeTypeOf('string')
      expect(value.length).toBeGreaterThan(0)
    }
  })
})
