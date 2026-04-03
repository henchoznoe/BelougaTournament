/**
 * File: tests/actions/users.test.ts
 * Description: Unit tests for unified user server actions (promote, demote, ban, unban, update, delete).
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

const mockIsOwner = vi.fn()
vi.mock('@/lib/utils/owner', () => ({
  isOwner: (...args: unknown[]) => mockIsOwner(...args),
}))

const mockUserFindUnique = vi.fn()
const mockUserUpdate = vi.fn()
const mockUserDelete = vi.fn()
const mockAdminAssignmentDeleteMany = vi.fn()
const mockAdminAssignmentCreateMany = vi.fn()
const mockSessionDeleteMany = vi.fn()
const mockTransaction = vi.fn()

vi.mock('@/lib/core/prisma', () => ({
  default: {
    user: {
      findUnique: (...args: unknown[]) => mockUserFindUnique(...args),
      update: (...args: unknown[]) => mockUserUpdate(...args),
      delete: (...args: unknown[]) => mockUserDelete(...args),
    },
    adminAssignment: {
      deleteMany: (...args: unknown[]) =>
        mockAdminAssignmentDeleteMany(...args),
      createMany: (...args: unknown[]) =>
        mockAdminAssignmentCreateMany(...args),
    },
    session: {
      deleteMany: (...args: unknown[]) => mockSessionDeleteMany(...args),
    },
    $transaction: (...args: unknown[]) => mockTransaction(...args),
  },
}))

// ---------------------------------------------------------------------------
// Module under test
// ---------------------------------------------------------------------------

const {
  promoteToAdmin,
  promoteToSuperAdmin,
  demoteAdmin,
  updateUser,
  banUser,
  unbanUser,
  deleteUser,
} = await import('@/lib/actions/users')

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const VALID_UUID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
const OTHER_UUID = 'b1ffc299-9c0b-4ef8-bb6d-6bb9bd380a22'
const TOURN_UUID = 'c2eec399-9c0b-4ef8-bb6d-6bb9bd380a33'

const SUPERADMIN_SESSION = {
  user: {
    id: VALID_UUID,
    role: Role.SUPERADMIN,
    email: 'sa@test.com',
    name: 'Super',
  },
  session: {
    id: 'sess-1',
    userId: VALID_UUID,
    token: 'tok',
    expiresAt: '2027-01-01',
  },
}

const ADMIN_SESSION = {
  user: {
    id: 'admin-1',
    role: Role.ADMIN,
    email: 'admin@test.com',
    name: 'Admin',
  },
  session: {
    id: 'sess-2',
    userId: 'admin-1',
    token: 'tok',
    expiresAt: '2027-01-01',
  },
}

const OWNER_UUID = 'd3ffd499-9c0b-4ef8-bb6d-6bb9bd380a44'

const OWNER_SESSION = {
  user: {
    id: OWNER_UUID,
    role: Role.SUPERADMIN,
    email: 'owner@test.com',
    name: 'Owner',
  },
  session: {
    id: 'sess-3',
    userId: OWNER_UUID,
    token: 'tok',
    expiresAt: '2027-01-01',
  },
}

const BAN_DATE = new Date('2027-01-01T00:00:00Z')

// ---------------------------------------------------------------------------
// promoteToAdmin
// ---------------------------------------------------------------------------

describe('promoteToAdmin', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetSession.mockResolvedValue(SUPERADMIN_SESSION)
    mockTransaction.mockResolvedValue([])
  })

  it('returns Unauthorized when not authenticated', async () => {
    mockGetSession.mockResolvedValue(null)

    expect(await promoteToAdmin({ userId: VALID_UUID })).toEqual({
      success: false,
      message: 'Unauthorized',
    })
  })

  it('returns error when user not found', async () => {
    mockUserFindUnique.mockResolvedValue(null)

    expect(await promoteToAdmin({ userId: VALID_UUID })).toEqual({
      success: false,
      message: 'Utilisateur introuvable.',
    })
  })

  it('returns error when user is already an admin', async () => {
    mockUserFindUnique.mockResolvedValue({ role: 'ADMIN', name: 'Alice' })

    expect(await promoteToAdmin({ userId: VALID_UUID })).toEqual({
      success: false,
      message: 'Alice est déjà admin.',
    })
  })

  it('promotes a USER to ADMIN and returns success', async () => {
    mockUserFindUnique.mockResolvedValue({ role: 'USER', name: 'Alice' })
    mockTransaction.mockResolvedValue([])

    const result = await promoteToAdmin({ userId: VALID_UUID })

    expect(result).toEqual({
      success: true,
      message: 'Alice a été promu admin.',
    })
    expect(mockTransaction).toHaveBeenCalledOnce()
    const transactionArg = mockTransaction.mock.calls[0][0]
    expect(Array.isArray(transactionArg)).toBe(true)
    expect(transactionArg).toHaveLength(2)
    expect(mockUserUpdate).toHaveBeenCalledWith({
      where: { id: VALID_UUID },
      data: { role: 'ADMIN' },
    })
    expect(mockSessionDeleteMany).toHaveBeenCalledWith({
      where: { userId: VALID_UUID },
    })
  })

  it('returns validation error for invalid UUID', async () => {
    const result = await promoteToAdmin({ userId: 'not-a-uuid' })

    expect(result.success).toBe(false)
    expect(result.message).toBe('Validation error')
  })
})

// ---------------------------------------------------------------------------
// demoteAdmin
// ---------------------------------------------------------------------------

describe('demoteAdmin', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetSession.mockResolvedValue(SUPERADMIN_SESSION)
    mockTransaction.mockResolvedValue([])
  })

  it('returns error when user not found', async () => {
    mockUserFindUnique.mockResolvedValue(null)

    expect(await demoteAdmin({ userId: VALID_UUID })).toEqual({
      success: false,
      message: 'Utilisateur introuvable.',
    })
  })

  it('returns error when trying to demote a SUPERADMIN', async () => {
    mockUserFindUnique.mockResolvedValue({ role: 'SUPERADMIN', name: 'Super' })
    mockIsOwner.mockReturnValue(false)

    expect(await demoteAdmin({ userId: OTHER_UUID })).toEqual({
      success: false,
      message: 'Impossible de rétrograder un super admin.',
    })
  })

  it('returns error when user is not an admin', async () => {
    mockUserFindUnique.mockResolvedValue({ role: 'USER', name: 'Alice' })

    expect(await demoteAdmin({ userId: OTHER_UUID })).toEqual({
      success: false,
      message: "Alice n'est pas admin.",
    })
  })

  it('returns error when trying to self-demote', async () => {
    mockUserFindUnique.mockResolvedValue({ role: 'ADMIN', name: 'Self' })

    expect(await demoteAdmin({ userId: VALID_UUID })).toEqual({
      success: false,
      message: 'Vous ne pouvez pas vous rétrograder.',
    })
  })

  it('demotes an ADMIN and returns success', async () => {
    mockUserFindUnique.mockResolvedValue({ role: 'ADMIN', name: 'Bob' })

    const result = await demoteAdmin({ userId: OTHER_UUID })

    expect(result).toEqual({ success: true, message: 'Bob a été rétrogradé.' })
    expect(mockTransaction).toHaveBeenCalledOnce()
    const transactionArg = mockTransaction.mock.calls[0][0]
    expect(Array.isArray(transactionArg)).toBe(true)
    expect(transactionArg).toHaveLength(3)
    expect(mockSessionDeleteMany).toHaveBeenCalledWith({
      where: { userId: OTHER_UUID },
    })
  })
})

// ---------------------------------------------------------------------------
// updateUser
// ---------------------------------------------------------------------------

describe('updateUser', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetSession.mockResolvedValue(SUPERADMIN_SESSION)
    mockTransaction.mockResolvedValue([])
    mockUserUpdate.mockResolvedValue({})
  })

  it('returns Unauthorized when not authenticated', async () => {
    mockGetSession.mockResolvedValue(null)

    expect(
      await updateUser({ userId: VALID_UUID, displayName: 'UserXYZ' }),
    ).toEqual({ success: false, message: 'Unauthorized' })
  })

  it('returns error when user not found', async () => {
    mockUserFindUnique.mockResolvedValue(null)

    expect(
      await updateUser({ userId: VALID_UUID, displayName: 'UserXYZ' }),
    ).toEqual({ success: false, message: 'Utilisateur introuvable.' })
  })

  it('returns error when user is SUPERADMIN', async () => {
    mockUserFindUnique.mockResolvedValue({ role: 'SUPERADMIN', name: 'Super' })

    expect(
      await updateUser({ userId: VALID_UUID, displayName: 'UserXYZ' }),
    ).toEqual({
      success: false,
      message: 'Impossible de modifier un super admin.',
    })
  })

  it('updates a USER displayName without tournament assignments', async () => {
    mockUserFindUnique.mockResolvedValue({ role: 'USER', name: 'Alice' })

    const result = await updateUser({
      userId: VALID_UUID,
      displayName: 'AliceXYZ',
    })

    expect(result).toEqual({
      success: true,
      message: 'Alice a été mis à jour.',
    })
    expect(mockUserUpdate).toHaveBeenCalledWith({
      where: { id: VALID_UUID },
      data: { displayName: 'AliceXYZ' },
    })
  })

  it('updates an ADMIN displayName and tournament assignments', async () => {
    mockUserFindUnique.mockResolvedValue({ role: 'ADMIN', name: 'Carol' })

    const result = await updateUser({
      userId: VALID_UUID,
      displayName: 'CarolXYZ',
      tournamentIds: [TOURN_UUID],
    })

    expect(result).toEqual({
      success: true,
      message: 'Carol a été mis à jour.',
    })
    expect(mockTransaction).toHaveBeenCalledOnce()
  })

  it('handles ADMIN with empty tournamentIds', async () => {
    mockUserFindUnique.mockResolvedValue({ role: 'ADMIN', name: 'Carol' })

    await updateUser({
      userId: VALID_UUID,
      displayName: 'CarolXYZ',
      tournamentIds: [],
    })

    expect(mockTransaction).toHaveBeenCalledOnce()
    const transactionArg = mockTransaction.mock.calls[0][0]
    expect(Array.isArray(transactionArg)).toBe(true)
    expect(transactionArg).toHaveLength(2)
  })

  it('allows ADMIN caller to update a USER', async () => {
    mockGetSession.mockResolvedValue(ADMIN_SESSION)
    mockUserFindUnique.mockResolvedValue({ role: Role.USER, name: 'Bob' })

    const result = await updateUser({
      userId: VALID_UUID,
      displayName: 'BobXYZ',
    })

    expect(result).toEqual({
      success: true,
      message: 'Bob a été mis à jour.',
    })
  })

  it('prevents ADMIN from modifying tournament assignments', async () => {
    mockGetSession.mockResolvedValue(ADMIN_SESSION)
    mockUserFindUnique.mockResolvedValue({ role: Role.ADMIN, name: 'Carol' })

    const result = await updateUser({
      userId: VALID_UUID,
      displayName: 'CarolXYZ',
      tournamentIds: [TOURN_UUID],
    })

    expect(result).toEqual({
      success: false,
      message: 'Seuls les super admins peuvent modifier les assignations.',
    })
  })

  it('returns validation error for invalid UUID', async () => {
    const result = await updateUser({
      userId: 'bad-id',
      displayName: 'UserXYZ',
    })

    expect(result.success).toBe(false)
    expect(result.message).toBe('Validation error')
  })

  it('returns validation error when displayName is too short', async () => {
    const result = await updateUser({
      userId: VALID_UUID,
      displayName: 'A',
    })

    expect(result.success).toBe(false)
    expect(result.message).toBe('Validation error')
  })
})

// ---------------------------------------------------------------------------
// banUser
// ---------------------------------------------------------------------------

describe('banUser', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetSession.mockResolvedValue(ADMIN_SESSION)
    mockUserUpdate.mockResolvedValue({})
  })

  it('returns Unauthorized when not authenticated', async () => {
    mockGetSession.mockResolvedValue(null)

    expect(
      await banUser({ userId: VALID_UUID, bannedUntil: BAN_DATE }),
    ).toEqual({ success: false, message: 'Unauthorized' })
  })

  it('returns Unauthorized when caller is a plain USER', async () => {
    mockGetSession.mockResolvedValue({
      user: { id: 'u-1', role: Role.USER },
      session: {},
    })

    expect(
      await banUser({ userId: VALID_UUID, bannedUntil: BAN_DATE }),
    ).toEqual({ success: false, message: 'Unauthorized' })
  })

  it('returns error when target user not found', async () => {
    mockUserFindUnique.mockResolvedValue(null)

    expect(
      await banUser({ userId: VALID_UUID, bannedUntil: BAN_DATE }),
    ).toEqual({ success: false, message: 'Utilisateur introuvable.' })
  })

  it('returns error when trying to ban an admin', async () => {
    mockUserFindUnique.mockResolvedValue({
      role: Role.ADMIN,
      name: 'AdminUser',
    })

    expect(
      await banUser({ userId: VALID_UUID, bannedUntil: BAN_DATE }),
    ).toEqual({
      success: false,
      message: 'Impossible de bannir un administrateur.',
    })
  })

  it('bans a USER and returns success', async () => {
    mockUserFindUnique.mockResolvedValue({ role: Role.USER, name: 'Alice' })

    const result = await banUser({
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

    await banUser({ userId: VALID_UUID, bannedUntil: BAN_DATE })

    expect(mockUserUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { bannedUntil: BAN_DATE, banReason: null },
      }),
    )
  })

  it('returns validation error for invalid UUID', async () => {
    const result = await banUser({ userId: 'bad-id', bannedUntil: BAN_DATE })

    expect(result.success).toBe(false)
    expect(result.message).toBe('Validation error')
  })

  it('allows SUPERADMIN to ban a player', async () => {
    mockGetSession.mockResolvedValue(SUPERADMIN_SESSION)
    mockUserFindUnique.mockResolvedValue({ role: Role.USER, name: 'Bob' })

    const result = await banUser({
      userId: VALID_UUID,
      bannedUntil: BAN_DATE,
    })

    expect(result).toEqual({ success: true, message: 'Bob a été banni.' })
  })
})

// ---------------------------------------------------------------------------
// unbanUser
// ---------------------------------------------------------------------------

describe('unbanUser', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetSession.mockResolvedValue(ADMIN_SESSION)
    mockUserUpdate.mockResolvedValue({})
  })

  it('returns Unauthorized when not authenticated', async () => {
    mockGetSession.mockResolvedValue(null)

    expect(await unbanUser({ userId: VALID_UUID })).toEqual({
      success: false,
      message: 'Unauthorized',
    })
  })

  it('returns error when user not found', async () => {
    mockUserFindUnique.mockResolvedValue(null)

    expect(await unbanUser({ userId: VALID_UUID })).toEqual({
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

    expect(await unbanUser({ userId: VALID_UUID })).toEqual({
      success: false,
      message: "Alice n'est pas banni.",
    })
  })

  it('unbans a user and returns success', async () => {
    mockUserFindUnique.mockResolvedValue({
      role: Role.USER,
      name: 'Alice',
      bannedUntil: BAN_DATE,
    })

    const result = await unbanUser({ userId: VALID_UUID })

    expect(result).toEqual({ success: true, message: 'Alice a été débanni.' })
    expect(mockUserUpdate).toHaveBeenCalledWith({
      where: { id: VALID_UUID },
      data: { bannedUntil: null, banReason: null },
    })
  })

  it('returns validation error for invalid UUID', async () => {
    const result = await unbanUser({ userId: 'not-valid' })

    expect(result.success).toBe(false)
    expect(result.message).toBe('Validation error')
  })
})

// ---------------------------------------------------------------------------
// deleteUser
// ---------------------------------------------------------------------------

describe('deleteUser', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetSession.mockResolvedValue(SUPERADMIN_SESSION)
    mockUserDelete.mockResolvedValue({})
  })

  it('returns Unauthorized when not authenticated', async () => {
    mockGetSession.mockResolvedValue(null)

    expect(await deleteUser({ userId: VALID_UUID })).toEqual({
      success: false,
      message: 'Unauthorized',
    })
  })

  it('returns Unauthorized when caller is ADMIN (not SUPERADMIN)', async () => {
    mockGetSession.mockResolvedValue(ADMIN_SESSION)

    expect(await deleteUser({ userId: VALID_UUID })).toEqual({
      success: false,
      message: 'Unauthorized',
    })
  })

  it('returns error when user not found', async () => {
    mockUserFindUnique.mockResolvedValue(null)

    expect(await deleteUser({ userId: VALID_UUID })).toEqual({
      success: false,
      message: 'Utilisateur introuvable.',
    })
  })

  it('returns error when target is not a USER role', async () => {
    mockUserFindUnique.mockResolvedValue({ role: Role.ADMIN, name: 'AdminGuy' })

    expect(await deleteUser({ userId: OTHER_UUID })).toEqual({
      success: false,
      message:
        "Seuls les utilisateurs avec le rôle Joueur peuvent être supprimés. Rétrogradez d'abord les admins.",
    })
  })

  it('returns error when target is SUPERADMIN', async () => {
    mockUserFindUnique.mockResolvedValue({
      role: Role.SUPERADMIN,
      name: 'Super',
    })

    expect(await deleteUser({ userId: OTHER_UUID })).toEqual({
      success: false,
      message:
        "Seuls les utilisateurs avec le rôle Joueur peuvent être supprimés. Rétrogradez d'abord les admins.",
    })
  })

  it('returns error when trying to self-delete', async () => {
    mockUserFindUnique.mockResolvedValue({ role: Role.USER, name: 'Self' })

    expect(await deleteUser({ userId: VALID_UUID })).toEqual({
      success: false,
      message: 'Vous ne pouvez pas vous supprimer.',
    })
  })

  it('deletes a USER and returns success', async () => {
    mockUserFindUnique.mockResolvedValue({ role: Role.USER, name: 'Alice' })

    const result = await deleteUser({ userId: OTHER_UUID })

    expect(result).toEqual({
      success: true,
      message: 'Alice a été supprimé définitivement.',
    })
    expect(mockUserDelete).toHaveBeenCalledWith({
      where: { id: OTHER_UUID },
    })
  })

  it('returns validation error for invalid UUID', async () => {
    const result = await deleteUser({ userId: 'not-a-uuid' })

    expect(result.success).toBe(false)
    expect(result.message).toBe('Validation error')
  })
})

// ---------------------------------------------------------------------------
// promoteToSuperAdmin
// ---------------------------------------------------------------------------

describe('promoteToSuperAdmin', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetSession.mockResolvedValue(OWNER_SESSION)
    mockIsOwner.mockReturnValue(true)
    mockTransaction.mockResolvedValue([])
  })

  it('returns Unauthorized when not authenticated', async () => {
    mockGetSession.mockResolvedValue(null)

    expect(await promoteToSuperAdmin({ userId: VALID_UUID })).toEqual({
      success: false,
      message: 'Unauthorized',
    })
  })

  it('returns Unauthorized when caller is not SUPERADMIN', async () => {
    mockGetSession.mockResolvedValue(ADMIN_SESSION)

    expect(await promoteToSuperAdmin({ userId: VALID_UUID })).toEqual({
      success: false,
      message: 'Unauthorized',
    })
  })

  it('returns error when caller is SUPERADMIN but not owner', async () => {
    mockGetSession.mockResolvedValue(SUPERADMIN_SESSION)
    mockIsOwner.mockReturnValue(false)

    expect(await promoteToSuperAdmin({ userId: OTHER_UUID })).toEqual({
      success: false,
      message: 'Seuls les owners peuvent promouvoir un super admin.',
    })
  })

  it('returns error when user not found', async () => {
    mockUserFindUnique.mockResolvedValue(null)

    expect(await promoteToSuperAdmin({ userId: VALID_UUID })).toEqual({
      success: false,
      message: 'Utilisateur introuvable.',
    })
  })

  it('returns error when target is not an ADMIN', async () => {
    mockUserFindUnique.mockResolvedValue({ role: Role.USER, name: 'Alice' })

    expect(await promoteToSuperAdmin({ userId: VALID_UUID })).toEqual({
      success: false,
      message: 'Alice doit être admin pour être promu super admin.',
    })
  })

  it('returns error when target is already SUPERADMIN', async () => {
    mockUserFindUnique.mockResolvedValue({
      role: Role.SUPERADMIN,
      name: 'Super',
    })

    expect(await promoteToSuperAdmin({ userId: VALID_UUID })).toEqual({
      success: false,
      message: 'Super doit être admin pour être promu super admin.',
    })
  })

  it('promotes an ADMIN to SUPERADMIN and returns success', async () => {
    mockUserFindUnique.mockResolvedValue({ role: Role.ADMIN, name: 'Bob' })

    const result = await promoteToSuperAdmin({ userId: VALID_UUID })

    expect(result).toEqual({
      success: true,
      message: 'Bob a été promu super admin.',
    })
    expect(mockTransaction).toHaveBeenCalledOnce()
    const transactionArg = mockTransaction.mock.calls[0][0]
    expect(Array.isArray(transactionArg)).toBe(true)
    expect(transactionArg).toHaveLength(3)
    expect(mockAdminAssignmentDeleteMany).toHaveBeenCalledWith({
      where: { adminId: VALID_UUID },
    })
    expect(mockUserUpdate).toHaveBeenCalledWith({
      where: { id: VALID_UUID },
      data: { role: Role.SUPERADMIN },
    })
    expect(mockSessionDeleteMany).toHaveBeenCalledWith({
      where: { userId: VALID_UUID },
    })
  })

  it('returns validation error for invalid UUID', async () => {
    const result = await promoteToSuperAdmin({ userId: 'bad-uuid' })

    expect(result.success).toBe(false)
    expect(result.message).toBe('Validation error')
  })
})

// ---------------------------------------------------------------------------
// demoteAdmin (owner scenarios)
// ---------------------------------------------------------------------------

describe('demoteAdmin (owner scenarios)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetSession.mockResolvedValue(OWNER_SESSION)
    mockIsOwner.mockReturnValue(true)
    mockTransaction.mockResolvedValue([])
  })

  it('owner can demote a SUPERADMIN to ADMIN', async () => {
    mockUserFindUnique.mockResolvedValue({
      role: Role.SUPERADMIN,
      name: 'Super',
    })

    const result = await demoteAdmin({ userId: OTHER_UUID })

    expect(result).toEqual({
      success: true,
      message: 'Super a été rétrogradé à admin.',
    })
    expect(mockTransaction).toHaveBeenCalledOnce()
    const transactionArg = mockTransaction.mock.calls[0][0]
    expect(Array.isArray(transactionArg)).toBe(true)
    expect(transactionArg).toHaveLength(2)
    expect(mockUserUpdate).toHaveBeenCalledWith({
      where: { id: OTHER_UUID },
      data: { role: Role.ADMIN },
    })
    expect(mockSessionDeleteMany).toHaveBeenCalledWith({
      where: { userId: OTHER_UUID },
    })
  })

  it('non-owner SUPERADMIN still cannot demote a SUPERADMIN', async () => {
    mockGetSession.mockResolvedValue(SUPERADMIN_SESSION)
    mockIsOwner.mockReturnValue(false)
    mockUserFindUnique.mockResolvedValue({
      role: Role.SUPERADMIN,
      name: 'Super',
    })

    expect(await demoteAdmin({ userId: OTHER_UUID })).toEqual({
      success: false,
      message: 'Impossible de rétrograder un super admin.',
    })
  })

  it('owner cannot self-demote', async () => {
    mockUserFindUnique.mockResolvedValue({
      role: Role.SUPERADMIN,
      name: 'Owner',
    })

    expect(await demoteAdmin({ userId: OWNER_UUID })).toEqual({
      success: false,
      message: 'Vous ne pouvez pas vous rétrograder.',
    })
  })
})
