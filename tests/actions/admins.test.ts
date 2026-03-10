/**
 * File: tests/actions/admins.test.ts
 * Description: Unit tests for admin server actions (promote, demote, updateAssignments, updateAdmin, searchUsersAction).
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
const mockAdminAssignmentDeleteMany = vi.fn()
const mockAdminAssignmentCreateMany = vi.fn()
const mockSessionDeleteMany = vi.fn()
const mockTransaction = vi.fn()

vi.mock('@/lib/core/prisma', () => ({
  default: {
    user: {
      findUnique: (...args: unknown[]) => mockUserFindUnique(...args),
      update: (...args: unknown[]) => mockUserUpdate(...args),
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

const mockSearchUsers = vi.fn()
vi.mock('@/lib/services/admins', () => ({
  searchUsers: (...args: unknown[]) => mockSearchUsers(...args),
}))

// ---------------------------------------------------------------------------
// Module under test
// ---------------------------------------------------------------------------

const {
  promoteToAdmin,
  demoteAdmin,
  updateAdminAssignments,
  updateAdmin,
  searchUsersAction,
} = await import('@/lib/actions/admins')

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
    // Transaction should include user.update and session.deleteMany
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

    expect(await demoteAdmin({ userId: VALID_UUID })).toEqual({
      success: false,
      message: 'Impossible de rétrograder un super admin.',
    })
  })

  it('returns error when user is not an admin', async () => {
    mockUserFindUnique.mockResolvedValue({ role: 'USER', name: 'Alice' })

    expect(await demoteAdmin({ userId: VALID_UUID })).toEqual({
      success: false,
      message: "Alice n'est pas admin.",
    })
  })

  it('returns error when trying to self-demote', async () => {
    // Session user id = VALID_UUID — demoting the same user should be blocked
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
    // Transaction should include adminAssignment.deleteMany, user.update, and session.deleteMany
    const transactionArg = mockTransaction.mock.calls[0][0]
    expect(Array.isArray(transactionArg)).toBe(true)
    expect(transactionArg).toHaveLength(3)
    expect(mockSessionDeleteMany).toHaveBeenCalledWith({
      where: { userId: OTHER_UUID },
    })
  })
})

// ---------------------------------------------------------------------------
// updateAdminAssignments
// ---------------------------------------------------------------------------

describe('updateAdminAssignments', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetSession.mockResolvedValue(SUPERADMIN_SESSION)
    mockTransaction.mockResolvedValue([])
  })

  it('returns error when user not found', async () => {
    mockUserFindUnique.mockResolvedValue(null)

    expect(
      await updateAdminAssignments({ userId: VALID_UUID, tournamentIds: [] }),
    ).toEqual({ success: false, message: 'Utilisateur introuvable.' })
  })

  it('returns error when user is SUPERADMIN', async () => {
    mockUserFindUnique.mockResolvedValue({ role: 'SUPERADMIN', name: 'Super' })

    expect(
      await updateAdminAssignments({ userId: VALID_UUID, tournamentIds: [] }),
    ).toEqual({
      success: false,
      message: 'Les super admins ont accès à tous les tournois.',
    })
  })

  it('returns error when user is not an admin', async () => {
    mockUserFindUnique.mockResolvedValue({ role: 'USER', name: 'Alice' })

    expect(
      await updateAdminAssignments({ userId: VALID_UUID, tournamentIds: [] }),
    ).toEqual({ success: false, message: "Alice n'est pas admin." })
  })

  it('updates assignments and returns success', async () => {
    mockUserFindUnique.mockResolvedValue({ role: 'ADMIN', name: 'Carol' })

    const result = await updateAdminAssignments({
      userId: VALID_UUID,
      tournamentIds: [TOURN_UUID],
    })

    expect(result).toEqual({
      success: true,
      message: 'Assignations de Carol mises à jour.',
    })
    expect(mockTransaction).toHaveBeenCalledOnce()
  })

  it('handles empty tournamentIds array without createMany call', async () => {
    mockUserFindUnique.mockResolvedValue({ role: 'ADMIN', name: 'Carol' })

    await updateAdminAssignments({ userId: VALID_UUID, tournamentIds: [] })

    expect(mockTransaction).toHaveBeenCalledOnce()
    // With no tournamentIds, the transaction array should only contain deleteMany
    const transactionArg = mockTransaction.mock.calls[0][0]
    expect(Array.isArray(transactionArg)).toBe(true)
    expect(transactionArg).toHaveLength(1)
  })
})

// ---------------------------------------------------------------------------
// searchUsersAction
// ---------------------------------------------------------------------------

describe('searchUsersAction', () => {
  beforeEach(() => vi.clearAllMocks())

  it('delegates to the searchUsers service', async () => {
    const mockResults = [
      { id: 'u1', name: 'Alice', email: 'alice@test.com', image: null },
    ]
    mockSearchUsers.mockResolvedValue(mockResults)

    const result = await searchUsersAction('alice')

    expect(result).toEqual(mockResults)
    expect(mockSearchUsers).toHaveBeenCalledWith('alice')
  })
})

// ---------------------------------------------------------------------------
// updateAdmin
// ---------------------------------------------------------------------------

describe('updateAdmin', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetSession.mockResolvedValue(SUPERADMIN_SESSION)
    mockTransaction.mockResolvedValue([])
  })

  it('returns Unauthorized when not authenticated', async () => {
    mockGetSession.mockResolvedValue(null)

    expect(
      await updateAdmin({
        userId: VALID_UUID,
        displayName: 'AdminXYZ',
        tournamentIds: [],
      }),
    ).toEqual({ success: false, message: 'Unauthorized' })
  })

  it('returns error when user not found', async () => {
    mockUserFindUnique.mockResolvedValue(null)

    expect(
      await updateAdmin({
        userId: VALID_UUID,
        displayName: 'AdminXYZ',
        tournamentIds: [],
      }),
    ).toEqual({ success: false, message: 'Utilisateur introuvable.' })
  })

  it('returns error when user is SUPERADMIN', async () => {
    mockUserFindUnique.mockResolvedValue({ role: 'SUPERADMIN', name: 'Super' })

    expect(
      await updateAdmin({
        userId: VALID_UUID,
        displayName: 'AdminXYZ',
        tournamentIds: [],
      }),
    ).toEqual({
      success: false,
      message: 'Impossible de modifier un super admin.',
    })
  })

  it('returns error when user is not an admin', async () => {
    mockUserFindUnique.mockResolvedValue({ role: 'USER', name: 'Alice' })

    expect(
      await updateAdmin({
        userId: VALID_UUID,
        displayName: 'AdminXYZ',
        tournamentIds: [],
      }),
    ).toEqual({ success: false, message: "Alice n'est pas admin." })
  })

  it('updates displayName and assignments and returns success', async () => {
    mockUserFindUnique.mockResolvedValue({ role: 'ADMIN', name: 'Carol' })

    const result = await updateAdmin({
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

  it('handles empty tournamentIds without createMany call', async () => {
    mockUserFindUnique.mockResolvedValue({ role: 'ADMIN', name: 'Carol' })

    await updateAdmin({
      userId: VALID_UUID,
      displayName: 'CarolXYZ',
      tournamentIds: [],
    })

    expect(mockTransaction).toHaveBeenCalledOnce()
    // With no tournamentIds: user.update + deleteMany = 2 items
    const transactionArg = mockTransaction.mock.calls[0][0]
    expect(Array.isArray(transactionArg)).toBe(true)
    expect(transactionArg).toHaveLength(2)
  })

  it('returns validation error for invalid UUID', async () => {
    const result = await updateAdmin({
      userId: 'bad-id',
      displayName: 'AdminXYZ',
      tournamentIds: [],
    })

    expect(result.success).toBe(false)
    expect(result.message).toBe('Validation error')
  })

  it('returns validation error when displayName is too short', async () => {
    const result = await updateAdmin({
      userId: VALID_UUID,
      displayName: 'A',
      tournamentIds: [],
    })

    expect(result.success).toBe(false)
    expect(result.message).toBe('Validation error')
  })
})
