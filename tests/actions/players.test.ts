/**
 * File: tests/actions/players.test.ts
 * Description: Unit tests for player ban/unban server actions.
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

vi.mock('next/cache', () => ({
  revalidateTag: vi.fn(),
  cacheLife: vi.fn(),
  cacheTag: vi.fn(),
}))

const mockUserFindUnique = vi.fn()
const mockUserUpdate = vi.fn()

vi.mock('@/lib/core/prisma', () => ({
  default: {
    user: {
      findUnique: (...args: unknown[]) => mockUserFindUnique(...args),
      update: (...args: unknown[]) => mockUserUpdate(...args),
    },
  },
}))

// ---------------------------------------------------------------------------
// Module under test
// ---------------------------------------------------------------------------

const { banPlayer, unbanPlayer } = await import('@/lib/actions/players')

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

const VALID_UUID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
const BAN_DATE = new Date('2027-01-01T00:00:00Z')

// ---------------------------------------------------------------------------
// banPlayer
// ---------------------------------------------------------------------------

describe('banPlayer', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetSession.mockResolvedValue(ADMIN_SESSION)
    mockUserUpdate.mockResolvedValue({})
  })

  it('returns Unauthorized when not authenticated', async () => {
    mockGetSession.mockResolvedValue(null)

    expect(
      await banPlayer({ userId: VALID_UUID, bannedUntil: BAN_DATE }),
    ).toEqual({ success: false, message: 'Unauthorized' })
  })

  it('returns Unauthorized when caller is a plain USER', async () => {
    mockGetSession.mockResolvedValue({
      user: { id: 'u-1', role: Role.USER },
      session: {},
    })

    expect(
      await banPlayer({ userId: VALID_UUID, bannedUntil: BAN_DATE }),
    ).toEqual({ success: false, message: 'Unauthorized' })
  })

  it('returns error when target user not found', async () => {
    mockUserFindUnique.mockResolvedValue(null)

    expect(
      await banPlayer({ userId: VALID_UUID, bannedUntil: BAN_DATE }),
    ).toEqual({ success: false, message: 'Utilisateur introuvable.' })
  })

  it('returns error when trying to ban an admin', async () => {
    mockUserFindUnique.mockResolvedValue({
      role: Role.ADMIN,
      name: 'AdminUser',
    })

    expect(
      await banPlayer({ userId: VALID_UUID, bannedUntil: BAN_DATE }),
    ).toEqual({
      success: false,
      message: 'Impossible de bannir un administrateur.',
    })
  })

  it('bans a USER and returns success', async () => {
    mockUserFindUnique.mockResolvedValue({ role: Role.USER, name: 'Alice' })

    const result = await banPlayer({
      userId: VALID_UUID,
      bannedUntil: BAN_DATE,
      banReason: 'Cheating',
    })

    expect(result).toEqual({ success: true, message: 'Alice a été banni.' })
    expect(mockUserUpdate).toHaveBeenCalledWith({
      where: { id: VALID_UUID },
      data: { bannedUntil: BAN_DATE, banReason: 'Cheating' },
    })
  })

  it('sets banReason to null when not provided', async () => {
    mockUserFindUnique.mockResolvedValue({ role: Role.USER, name: 'Alice' })

    await banPlayer({ userId: VALID_UUID, bannedUntil: BAN_DATE })

    expect(mockUserUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { bannedUntil: BAN_DATE, banReason: null },
      }),
    )
  })

  it('returns validation error for invalid UUID', async () => {
    const result = await banPlayer({ userId: 'bad-id', bannedUntil: BAN_DATE })

    expect(result.success).toBe(false)
    expect(result.message).toBe('Validation error')
  })

  it('allows SUPERADMIN to ban a player', async () => {
    mockGetSession.mockResolvedValue({
      user: { id: 'sa-1', role: Role.SUPERADMIN },
      session: {},
    })
    mockUserFindUnique.mockResolvedValue({ role: Role.USER, name: 'Bob' })

    const result = await banPlayer({
      userId: VALID_UUID,
      bannedUntil: BAN_DATE,
    })

    expect(result).toEqual({ success: true, message: 'Bob a été banni.' })
  })
})

// ---------------------------------------------------------------------------
// unbanPlayer
// ---------------------------------------------------------------------------

describe('unbanPlayer', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetSession.mockResolvedValue(ADMIN_SESSION)
    mockUserUpdate.mockResolvedValue({})
  })

  it('returns Unauthorized when not authenticated', async () => {
    mockGetSession.mockResolvedValue(null)

    expect(await unbanPlayer({ userId: VALID_UUID })).toEqual({
      success: false,
      message: 'Unauthorized',
    })
  })

  it('returns error when user not found', async () => {
    mockUserFindUnique.mockResolvedValue(null)

    expect(await unbanPlayer({ userId: VALID_UUID })).toEqual({
      success: false,
      message: 'Utilisateur introuvable.',
    })
  })

  it('returns error when user is not banned', async () => {
    mockUserFindUnique.mockResolvedValue({
      role: Role.USER,
      name: 'Alice',
      bannedUntil: null,
    })

    expect(await unbanPlayer({ userId: VALID_UUID })).toEqual({
      success: false,
      message: "Alice n'est pas banni.",
    })
  })

  it('unbans a player and returns success', async () => {
    mockUserFindUnique.mockResolvedValue({
      role: Role.USER,
      name: 'Alice',
      bannedUntil: BAN_DATE,
    })

    const result = await unbanPlayer({ userId: VALID_UUID })

    expect(result).toEqual({ success: true, message: 'Alice a été débanni.' })
    expect(mockUserUpdate).toHaveBeenCalledWith({
      where: { id: VALID_UUID },
      data: { bannedUntil: null, banReason: null },
    })
  })

  it('returns validation error for invalid UUID', async () => {
    const result = await unbanPlayer({ userId: 'not-valid' })

    expect(result.success).toBe(false)
    expect(result.message).toBe('Validation error')
  })
})
