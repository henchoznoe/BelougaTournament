/**
 * File: tests/services/settings.test.ts
 * Description: Unit tests for the global settings service.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock('next/cache', () => ({ cacheLife: vi.fn(), cacheTag: vi.fn() }))
vi.mock('@/lib/core/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))

const mockFindUnique = vi.fn()
vi.mock('@/lib/core/prisma', () => ({
  default: {
    globalSettings: {
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
    },
  },
}))

// ---------------------------------------------------------------------------
// Module under test
// ---------------------------------------------------------------------------

const { getGlobalSettings } = await import('@/lib/services/settings')

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const MOCK_SETTINGS = {
  id: 1,
  logoUrl: 'https://example.com/logo.png',
  twitchUsername: 'belougagg',
  twitchUrl: 'https://twitch.tv/belougagg',
  instagramUrl: null,
  tiktokUrl: null,
  youtubeUrl: null,
  discordUrl: 'https://discord.gg/belouga',
  feature1Title: 'Matchmaking Équitable',
  feature1Description: 'Affrontez des joueurs de votre niveau.',
  feature2Title: 'Format Compétitif',
  feature2Description: 'Arbre de tournoi professionnel.',
  feature3Title: 'Diffusion en Direct',
  feature3Description: 'Les phases finales sont diffusées sur Twitch.',
}

const DEFAULT_SETTINGS = {
  id: 1,
  logoUrl: null,
  twitchUsername: null,
  twitchUrl: null,
  instagramUrl: null,
  tiktokUrl: null,
  youtubeUrl: null,
  discordUrl: null,
  feature1Title: null,
  feature1Description: null,
  feature2Title: null,
  feature2Description: null,
  feature3Title: null,
  feature3Description: null,
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('getGlobalSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns the settings record when found in the database', async () => {
    mockFindUnique.mockResolvedValue(MOCK_SETTINGS)

    const result = await getGlobalSettings()

    expect(result).toEqual(MOCK_SETTINGS)
    expect(mockFindUnique).toHaveBeenCalledWith({ where: { id: 1 } })
  })

  it('returns default settings when no record exists (null)', async () => {
    mockFindUnique.mockResolvedValue(null)

    const result = await getGlobalSettings()

    expect(result).toEqual(DEFAULT_SETTINGS)
  })

  it('returns default settings on database error', async () => {
    mockFindUnique.mockRejectedValue(new Error('DB connection failed'))

    const result = await getGlobalSettings()

    expect(result).toEqual(DEFAULT_SETTINGS)
  })

  it('returns feature fields from the database when present', async () => {
    mockFindUnique.mockResolvedValue(MOCK_SETTINGS)

    const result = await getGlobalSettings()

    expect(result.feature1Title).toBe('Matchmaking Équitable')
    expect(result.feature2Title).toBe('Format Compétitif')
    expect(result.feature3Title).toBe('Diffusion en Direct')
  })

  it('returns null feature fields in default settings', async () => {
    mockFindUnique.mockResolvedValue(null)

    const result = await getGlobalSettings()

    expect(result.feature1Title).toBeNull()
    expect(result.feature1Description).toBeNull()
    expect(result.feature2Title).toBeNull()
    expect(result.feature2Description).toBeNull()
    expect(result.feature3Title).toBeNull()
    expect(result.feature3Description).toBeNull()
  })
})
