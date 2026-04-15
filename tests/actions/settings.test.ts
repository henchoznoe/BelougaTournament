/**
 * File: tests/actions/settings.test.ts
 * Description: Unit tests for the updateSettings server action.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Role } from '@/prisma/generated/prisma/enums'

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock('server-only', () => ({}))

const mockGetSession = vi.fn()
vi.mock('@/lib/core/auth', () => ({
  default: {
    api: { getSession: (...args: unknown[]) => mockGetSession(...args) },
  },
}))

vi.mock('next/headers', () => ({
  headers: vi.fn().mockResolvedValue(new Headers()),
}))

vi.mock('@/lib/core/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))

const mockRevalidateTag = vi.fn()
vi.mock('next/cache', () => ({
  revalidateTag: (...args: unknown[]) => mockRevalidateTag(...args),
  cacheLife: vi.fn(),
  cacheTag: vi.fn(),
}))

const mockGlobalSettingsUpsert = vi.fn()
vi.mock('@/lib/core/prisma', () => ({
  default: {
    globalSettings: {
      upsert: (...args: unknown[]) => mockGlobalSettingsUpsert(...args),
    },
  },
}))

// ---------------------------------------------------------------------------
// Module under test
// ---------------------------------------------------------------------------

const { updateSettings } = await import('@/lib/actions/settings')

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const ADMIN_SESSION = {
  user: {
    id: 'admin-1',
    role: Role.ADMIN,
    email: 'admin@test.com',
    name: 'Admin',
  },
  session: {
    id: 'sess-1',
    userId: 'admin-1',
    token: 'tok',
    expiresAt: '2027-01-01',
  },
}

const VALID_SETTINGS = {
  logoUrl: 'https://example.com/logo.png',
  twitchUsername: 'belougagg',
  twitchUrl: 'https://twitch.tv/belougagg',
  discordUrl: 'https://discord.gg/belouga',
  instagramUrl: '',
  tiktokUrl: '',
  youtubeUrl: '',
  feature1Title: 'Matchmaking Équitable',
  feature1Description: 'Affrontez des joueurs de votre niveau.',
  feature2Title: 'Format Compétitif',
  feature2Description: 'Arbre de tournoi professionnel.',
  feature3Title: 'Diffusion en Direct',
  feature3Description: 'Les phases finales sont diffusées sur Twitch.',
}

// ---------------------------------------------------------------------------
// updateSettings
// ---------------------------------------------------------------------------

describe('updateSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetSession.mockResolvedValue(ADMIN_SESSION)
    mockGlobalSettingsUpsert.mockResolvedValue({})
  })

  it('returns Unauthorized when not authenticated', async () => {
    mockGetSession.mockResolvedValue(null)

    expect(await updateSettings(VALID_SETTINGS)).toEqual({
      success: false,
      message: 'Unauthorized',
    })
  })

  it('returns Unauthorized for non-admin role', async () => {
    mockGetSession.mockResolvedValue({
      user: { id: 'user-1', role: Role.USER },
      session: {},
    })

    expect(await updateSettings(VALID_SETTINGS)).toEqual({
      success: false,
      message: 'Unauthorized',
    })
  })

  it('upserts settings and returns success', async () => {
    const result = await updateSettings(VALID_SETTINGS)

    expect(result).toEqual({
      success: true,
      message: 'Les paramètres ont été mis à jour.',
    })
    expect(mockGlobalSettingsUpsert).toHaveBeenCalledOnce()
  })

  it('converts empty strings to null in the upsert call', async () => {
    await updateSettings(VALID_SETTINGS)

    const upsertArg = mockGlobalSettingsUpsert.mock.calls[0][0]
    // instagramUrl, tiktokUrl, youtubeUrl are '' in input → should be null
    expect(upsertArg.update.instagramUrl).toBeNull()
    expect(upsertArg.update.tiktokUrl).toBeNull()
    expect(upsertArg.update.youtubeUrl).toBeNull()
    // Non-empty strings should be preserved
    expect(upsertArg.update.twitchUsername).toBe('belougagg')
  })

  it('calls revalidateTag with the settings tag', async () => {
    await updateSettings(VALID_SETTINGS)

    expect(mockRevalidateTag).toHaveBeenCalledWith('settings', 'hours')
  })

  it('returns validation error for invalid URL', async () => {
    const result = await updateSettings({
      ...VALID_SETTINGS,
      twitchUrl: 'not-a-url',
    })

    expect(result.success).toBe(false)
    expect(result.message).toBe('Validation error')
  })

  it('returns Internal server error when prisma upsert throws', async () => {
    mockGlobalSettingsUpsert.mockRejectedValue(new Error('DB failure'))

    const result = await updateSettings(VALID_SETTINGS)

    expect(result).toEqual({ success: false, message: 'Internal server error' })
  })

  it('persists feature titles and descriptions in the upsert call', async () => {
    await updateSettings(VALID_SETTINGS)

    const upsertArg = mockGlobalSettingsUpsert.mock.calls[0][0]
    expect(upsertArg.update.feature1Title).toBe('Matchmaking Équitable')
    expect(upsertArg.update.feature2Title).toBe('Format Compétitif')
    expect(upsertArg.update.feature3Title).toBe('Diffusion en Direct')
    expect(upsertArg.update.feature1Description).toBe(
      'Affrontez des joueurs de votre niveau.',
    )
    expect(upsertArg.update.feature2Description).toBe(
      'Arbre de tournoi professionnel.',
    )
    expect(upsertArg.update.feature3Description).toBe(
      'Les phases finales sont diffusées sur Twitch.',
    )
  })

  it('converts empty feature fields to null in the upsert call', async () => {
    await updateSettings({
      ...VALID_SETTINGS,
      feature1Title: '',
      feature1Description: '',
      feature2Title: '',
      feature2Description: '',
      feature3Title: '',
      feature3Description: '',
    })

    const upsertArg = mockGlobalSettingsUpsert.mock.calls[0][0]
    expect(upsertArg.update.feature1Title).toBeNull()
    expect(upsertArg.update.feature1Description).toBeNull()
    expect(upsertArg.update.feature2Title).toBeNull()
    expect(upsertArg.update.feature2Description).toBeNull()
    expect(upsertArg.update.feature3Title).toBeNull()
    expect(upsertArg.update.feature3Description).toBeNull()
  })

  it('returns validation error for feature title exceeding 50 characters', async () => {
    const result = await updateSettings({
      ...VALID_SETTINGS,
      feature1Title: 'A'.repeat(51),
    })

    expect(result.success).toBe(false)
    expect(result.message).toBe('Validation error')
  })
})
