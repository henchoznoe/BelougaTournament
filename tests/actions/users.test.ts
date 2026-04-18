/**
 * File: tests/actions/users.test.ts
 * Description: Unit tests for unified user server actions.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Role } from '@/prisma/generated/prisma/enums'

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

const mockIsOwner = vi.fn()
vi.mock('@/lib/utils/owner', () => ({
  isOwner: (...args: unknown[]) => mockIsOwner(...args),
}))

const mockUserFindUnique = vi.fn()
const mockUserUpdate = vi.fn()
const mockUserDelete = vi.fn()
const mockSessionDeleteMany = vi.fn()
const mockTransaction = vi.fn()

vi.mock('@/lib/core/prisma', () => ({
  default: {
    user: {
      findUnique: (...args: unknown[]) => mockUserFindUnique(...args),
      update: (...args: unknown[]) => mockUserUpdate(...args),
      delete: (...args: unknown[]) => mockUserDelete(...args),
    },
    session: {
      deleteMany: (...args: unknown[]) => mockSessionDeleteMany(...args),
    },
    $transaction: (...args: unknown[]) => mockTransaction(...args),
  },
}))

const { promoteToAdmin, demoteAdmin, updateUser, deleteUser } = await import(
  '@/lib/actions/users'
)

const VALID_UUID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
const OTHER_UUID = 'b1ffc299-9c0b-4ef8-bb6d-6bb9bd380a22'

const ADMIN_SESSION = {
  user: {
    id: VALID_UUID,
    role: Role.ADMIN,
    email: 'admin@test.com',
    name: 'Admin',
  },
  session: {
    id: 'sess-1',
    userId: VALID_UUID,
    token: 'tok',
    expiresAt: '2027-01-01',
  },
}

describe('promoteToAdmin', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetSession.mockResolvedValue(ADMIN_SESSION)
    mockTransaction.mockResolvedValue([])
  })

  it('returns Unauthorized when not authenticated', async () => {
    mockGetSession.mockResolvedValue(null)

    expect(await promoteToAdmin({ userId: VALID_UUID })).toEqual({
      success: false,
      message: 'Unauthorized',
    })
  })

  it('rejects non-owner callers', async () => {
    mockIsOwner.mockReturnValue(false)

    expect(await promoteToAdmin({ userId: VALID_UUID })).toEqual({
      success: false,
      message: 'Seuls les owners peuvent modifier les rôles.',
    })
  })

  it('promotes a USER to ADMIN for owners', async () => {
    mockIsOwner.mockReturnValue(true)
    mockUserFindUnique.mockResolvedValue({ role: Role.USER, name: 'Alice' })

    const result = await promoteToAdmin({ userId: VALID_UUID })

    expect(result).toEqual({
      success: true,
      message: 'Alice a été promu admin.',
    })
    expect(mockUserUpdate).toHaveBeenCalledWith({
      where: { id: VALID_UUID },
      data: { role: Role.ADMIN },
    })
    expect(mockSessionDeleteMany).toHaveBeenCalledWith({
      where: { userId: VALID_UUID },
    })
  })
})

describe('demoteAdmin', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetSession.mockResolvedValue(ADMIN_SESSION)
    mockTransaction.mockResolvedValue([])
  })

  it('prevents self-demotion', async () => {
    mockIsOwner.mockReturnValue(true)
    mockUserFindUnique.mockResolvedValue({ role: Role.ADMIN, name: 'Admin' })

    expect(await demoteAdmin({ userId: VALID_UUID })).toEqual({
      success: false,
      message: 'Vous ne pouvez pas vous rétrograder.',
    })
  })

  it('demotes an ADMIN to USER for owners', async () => {
    mockIsOwner.mockReturnValue(true)
    mockUserFindUnique.mockResolvedValue({ role: Role.ADMIN, name: 'Bob' })

    const result = await demoteAdmin({ userId: OTHER_UUID })

    expect(result).toEqual({ success: true, message: 'Bob a été rétrogradé.' })
    expect(mockUserUpdate).toHaveBeenCalledWith({
      where: { id: OTHER_UUID },
      data: { role: Role.USER },
    })
  })
})

describe('updateUser', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetSession.mockResolvedValue(ADMIN_SESSION)
  })

  it('updates a user display name', async () => {
    mockUserFindUnique.mockResolvedValue({ name: 'Carol' })
    mockUserUpdate.mockResolvedValue({})

    const result = await updateUser({
      userId: OTHER_UUID,
      displayName: 'CarolNew',
    })

    expect(result).toEqual({
      success: true,
      message: 'Carol a été mis à jour.',
    })
    expect(mockUserUpdate).toHaveBeenCalledWith({
      where: { id: OTHER_UUID },
      data: { displayName: 'CarolNew' },
    })
  })
})

describe('deleteUser', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetSession.mockResolvedValue(ADMIN_SESSION)
  })

  it('rejects non-owner callers', async () => {
    mockIsOwner.mockReturnValue(false)

    expect(await deleteUser({ userId: OTHER_UUID })).toEqual({
      success: false,
      message: 'Seuls les owners peuvent supprimer un utilisateur.',
    })
  })

  it('deletes a USER target for owners', async () => {
    mockIsOwner.mockReturnValue(true)
    mockUserFindUnique.mockResolvedValue({ role: Role.USER, name: 'Alice' })
    mockUserDelete.mockResolvedValue({})

    const result = await deleteUser({ userId: OTHER_UUID })

    expect(result).toEqual({
      success: true,
      message: 'Alice a été supprimé définitivement.',
    })
    expect(mockUserDelete).toHaveBeenCalledWith({ where: { id: OTHER_UUID } })
  })
})
