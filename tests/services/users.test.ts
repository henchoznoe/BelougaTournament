/**
 * File: tests/services/users.test.ts
 * Description: Unit tests for the unified users service.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  Role,
  TournamentFormat,
  TournamentStatus,
} from '@/prisma/generated/prisma/enums'

vi.mock('server-only', () => ({}))
vi.mock('next/cache', () => ({ cacheLife: vi.fn(), cacheTag: vi.fn() }))
vi.mock('@/lib/core/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))

const mockUserFindUnique = vi.fn()
const mockUserFindMany = vi.fn()
vi.mock('@/lib/core/prisma', () => ({
  default: {
    user: {
      findUnique: (...args: unknown[]) => mockUserFindUnique(...args),
      findMany: (...args: unknown[]) => mockUserFindMany(...args),
    },
  },
}))

const { getUserProfile, getUsers, getUserById } = await import(
  '@/lib/services/users'
)

const MOCK_PROFILE = {
  name: 'TestPlayer',
  displayName: 'Test Player',
  email: 'test@example.com',
  image: 'https://cdn.discordapp.com/avatars/123/abc.png',
  role: Role.USER,
  createdAt: new Date('2026-01-01T00:00:00Z'),
  lastLoginAt: new Date('2026-04-15T19:30:00Z'),
}

const MOCK_USERS = [
  {
    id: 'user-1',
    name: 'PlayerOne',
    displayName: 'Player One',
    email: 'player1@example.com',
    image: null,
    discordId: 'discord-1',
    role: Role.USER,
    createdAt: new Date('2026-01-01'),
    lastLoginAt: new Date('2026-04-15T19:30:00Z'),
    bannedUntil: null,
    banReason: null,
    _count: { registrations: 3 },
  },
  {
    id: 'admin-1',
    name: 'AdminUser',
    displayName: 'Admin User',
    email: 'admin@example.com',
    image: null,
    discordId: 'discord-2',
    role: Role.ADMIN,
    createdAt: new Date('2026-02-01'),
    lastLoginAt: null,
    bannedUntil: null,
    banReason: null,
    _count: { registrations: 0 },
  },
]

const MOCK_USER_DETAIL = {
  id: 'user-1',
  name: 'PlayerOne',
  displayName: 'Player One',
  email: 'player1@example.com',
  image: null,
  discordId: 'discord-1',
  role: Role.USER,
  createdAt: new Date('2026-01-01'),
  lastLoginAt: new Date('2026-04-15T19:30:00Z'),
  bannedUntil: null,
  banReason: null,
  registrations: [
    {
      id: 'reg-1',
      createdAt: new Date('2026-01-15'),
      tournament: {
        title: 'Tournoi Alpha',
        format: TournamentFormat.SOLO,
        status: TournamentStatus.PUBLISHED,
      },
      team: null,
    },
  ],
}

describe('getUserProfile', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns the user profile when found', async () => {
    mockUserFindUnique.mockResolvedValue(MOCK_PROFILE)

    expect(await getUserProfile('user-1')).toEqual(MOCK_PROFILE)
    expect(mockUserFindUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'user-1' } }),
    )
  })

  it('returns null on database error', async () => {
    mockUserFindUnique.mockRejectedValue(new Error('DB connection failed'))

    expect(await getUserProfile('user-1')).toBeNull()
  })
})

describe('getUsers', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns the list of all users', async () => {
    mockUserFindMany.mockResolvedValue(MOCK_USERS)

    expect(await getUsers()).toEqual(MOCK_USERS)
    expect(mockUserFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        select: expect.objectContaining({
          lastLoginAt: true,
        }),
      }),
    )
  })

  it('returns an empty array on database error', async () => {
    mockUserFindMany.mockRejectedValue(new Error('DB error'))

    expect(await getUsers()).toEqual([])
  })
})

describe('getUserById', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns the full user detail when found', async () => {
    mockUserFindUnique.mockResolvedValue(MOCK_USER_DETAIL)

    expect(await getUserById('user-1')).toEqual(MOCK_USER_DETAIL)
    expect(mockUserFindUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'user-1' },
        select: expect.objectContaining({
          lastLoginAt: true,
        }),
      }),
    )
  })

  it('returns null on database error', async () => {
    mockUserFindUnique.mockRejectedValue(new Error('DB connection failed'))

    expect(await getUserById('user-1')).toBeNull()
  })
})
