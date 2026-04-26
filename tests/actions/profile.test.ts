/**
 * File: tests/actions/profile.test.ts
 * Description: Unit tests for the updateProfile server action.
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

const mockUserUpdate = vi.fn()
vi.mock('@/lib/core/prisma', () => ({
  default: {
    user: { update: (...args: unknown[]) => mockUserUpdate(...args) },
  },
}))

// ---------------------------------------------------------------------------
// Module under test
// ---------------------------------------------------------------------------

vi.mock('next/cache', () => ({
  revalidateTag: vi.fn(),
  updateTag: vi.fn(),
  cacheLife: vi.fn(),
  cacheTag: vi.fn(),
}))

const { updateProfile, updateProfileVisibility } = await import(
  '@/lib/actions/profile'
)

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const USER_SESSION = {
  user: { id: 'user-1', role: Role.USER, email: 'user@test.com', name: 'User' },
  session: {
    id: 'sess-1',
    userId: 'user-1',
    token: 'tok',
    expiresAt: '2027-01-01',
  },
}

// ---------------------------------------------------------------------------
// updateProfile
// ---------------------------------------------------------------------------

describe('updateProfile', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetSession.mockResolvedValue(USER_SESSION)
    mockUserUpdate.mockResolvedValue({})
  })

  it('returns Unauthorized when not authenticated', async () => {
    mockGetSession.mockResolvedValue(null)

    expect(await updateProfile({ displayName: 'Alice' })).toEqual({
      success: false,
      message: 'Unauthorized',
    })
  })

  it('updates the displayName and returns success', async () => {
    const result = await updateProfile({ displayName: 'Alice' })

    expect(result).toEqual({
      success: true,
      message: 'Votre nom a été mis à jour.',
    })
    expect(mockUserUpdate).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { displayName: 'Alice' },
    })
  })

  it('works for any authenticated role (no role restriction)', async () => {
    mockGetSession.mockResolvedValue({
      user: { id: 'admin-1', role: Role.ADMIN },
      session: {},
    })

    const result = await updateProfile({ displayName: 'Bob' })

    expect(result.success).toBe(true)
  })

  it('returns validation error when displayName is too short', async () => {
    const result = await updateProfile({ displayName: 'A' })

    expect(result.success).toBe(false)
    expect(result.message).toBe('Validation error')
    expect(result.errors).toBeDefined()
  })

  it('returns validation error when displayName is too long', async () => {
    const result = await updateProfile({ displayName: 'A'.repeat(33) })

    expect(result.success).toBe(false)
    expect(result.message).toBe('Validation error')
  })

  it('returns validation error when displayName is missing', async () => {
    // @ts-expect-error testing missing field
    const result = await updateProfile({})

    expect(result.success).toBe(false)
    expect(result.message).toBe('Validation error')
  })

  it('returns Internal server error when prisma update throws', async () => {
    mockUserUpdate.mockRejectedValue(new Error('DB failure'))

    const result = await updateProfile({ displayName: 'Alice' })

    expect(result).toEqual({ success: false, message: 'Internal server error' })
  })
})

// ---------------------------------------------------------------------------
// updateProfileVisibility
// ---------------------------------------------------------------------------

describe('updateProfileVisibility', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetSession.mockResolvedValue(USER_SESSION)
    mockUserUpdate.mockResolvedValue({})
  })

  it('returns Unauthorized when not authenticated', async () => {
    mockGetSession.mockResolvedValue(null)

    expect(await updateProfileVisibility({ isPublic: true })).toEqual({
      success: false,
      message: 'Unauthorized',
    })
  })

  it('sets profile to public and returns success message', async () => {
    const result = await updateProfileVisibility({ isPublic: true })

    expect(result).toEqual({
      success: true,
      message: 'Votre profil est maintenant public.',
    })
    expect(mockUserUpdate).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { isPublic: true },
    })
  })

  it('sets profile to private and returns success message', async () => {
    const result = await updateProfileVisibility({ isPublic: false })

    expect(result).toEqual({
      success: true,
      message: 'Votre profil est maintenant privé.',
    })
    expect(mockUserUpdate).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { isPublic: false },
    })
  })

  it('returns validation error for invalid input', async () => {
    // @ts-expect-error testing invalid input
    const result = await updateProfileVisibility({ isPublic: 'not-a-boolean' })

    expect(result.success).toBe(false)
    expect(result.message).toBe('Validation error')
  })

  it('returns Internal server error when prisma update throws', async () => {
    mockUserUpdate.mockRejectedValue(new Error('DB failure'))

    const result = await updateProfileVisibility({ isPublic: true })

    expect(result).toEqual({ success: false, message: 'Internal server error' })
  })
})
