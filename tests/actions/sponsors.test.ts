/**
 * File: tests/actions/sponsors.test.ts
 * Description: Unit tests for sponsor CRUD server actions.
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

const mockSponsorCreate = vi.fn()
const mockSponsorUpdate = vi.fn()
const mockSponsorDelete = vi.fn()
vi.mock('@/lib/core/prisma', () => ({
  default: {
    sponsor: {
      create: (...args: unknown[]) => mockSponsorCreate(...args),
      update: (...args: unknown[]) => mockSponsorUpdate(...args),
      delete: (...args: unknown[]) => mockSponsorDelete(...args),
    },
  },
}))

// ---------------------------------------------------------------------------
// Module under test
// ---------------------------------------------------------------------------

const { createSponsor, updateSponsor, deleteSponsor } = await import(
  '@/lib/actions/sponsors'
)

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

const VALID_SPONSOR_INPUT = {
  name: 'Acme Corp',
  imageUrls: ['https://example.com/logo.png'],
  url: 'https://acme.com',
  supportedSince: '2024-03-15',
}

// ---------------------------------------------------------------------------
// createSponsor
// ---------------------------------------------------------------------------

describe('createSponsor', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetSession.mockResolvedValue(ADMIN_SESSION)
    mockSponsorCreate.mockResolvedValue({})
  })

  it('returns Unauthorized when not authenticated', async () => {
    mockGetSession.mockResolvedValue(null)

    expect(await createSponsor(VALID_SPONSOR_INPUT)).toEqual({
      success: false,
      message: 'Unauthorized',
    })
  })

  it('returns Unauthorized for non-admin role', async () => {
    mockGetSession.mockResolvedValue({
      user: { id: 'user-1', role: Role.USER },
      session: {},
    })

    expect(await createSponsor(VALID_SPONSOR_INPUT)).toEqual({
      success: false,
      message: 'Unauthorized',
    })
  })

  it('creates a sponsor and returns success', async () => {
    const result = await createSponsor(VALID_SPONSOR_INPUT)

    expect(result).toEqual({ success: true, message: 'Le sponsor a été créé.' })
    expect(mockSponsorCreate).toHaveBeenCalledWith({
      data: {
        name: 'Acme Corp',
        imageUrls: ['https://example.com/logo.png'],
        url: 'https://acme.com',
        supportedSince: new Date('2024-03-15T12:00:00.000Z'),
      },
    })
  })

  it('converts empty url string to null', async () => {
    await createSponsor({ ...VALID_SPONSOR_INPUT, url: '' })

    const createArg = mockSponsorCreate.mock.calls[0][0]
    expect(createArg.data.url).toBeNull()
  })

  it('calls revalidateTag with the sponsors tag', async () => {
    await createSponsor(VALID_SPONSOR_INPUT)

    expect(mockRevalidateTag).toHaveBeenCalledWith('sponsors', 'hours')
  })

  it('returns validation error when name is empty', async () => {
    const result = await createSponsor({ ...VALID_SPONSOR_INPUT, name: '' })

    expect(result.success).toBe(false)
    expect(result.message).toBe('Validation error')
  })

  it('returns validation error when imageUrls is empty', async () => {
    const result = await createSponsor({
      ...VALID_SPONSOR_INPUT,
      imageUrls: [],
    })

    expect(result.success).toBe(false)
    expect(result.message).toBe('Validation error')
  })

  it('returns Internal server error when prisma create throws', async () => {
    mockSponsorCreate.mockRejectedValue(new Error('DB error'))

    const result = await createSponsor(VALID_SPONSOR_INPUT)

    expect(result).toEqual({ success: false, message: 'Internal server error' })
  })
})

// ---------------------------------------------------------------------------
// updateSponsor
// ---------------------------------------------------------------------------

describe('updateSponsor', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetSession.mockResolvedValue(ADMIN_SESSION)
    mockSponsorUpdate.mockResolvedValue({})
  })

  it('returns Unauthorized when not authenticated', async () => {
    mockGetSession.mockResolvedValue(null)

    expect(
      await updateSponsor({ ...VALID_SPONSOR_INPUT, id: VALID_UUID }),
    ).toEqual({
      success: false,
      message: 'Unauthorized',
    })
  })

  it('updates a sponsor and returns success', async () => {
    const result = await updateSponsor({
      ...VALID_SPONSOR_INPUT,
      id: VALID_UUID,
    })

    expect(result).toEqual({
      success: true,
      message: 'Le sponsor a été mis à jour.',
    })
    expect(mockSponsorUpdate).toHaveBeenCalledWith({
      where: { id: VALID_UUID },
      data: {
        name: 'Acme Corp',
        imageUrls: ['https://example.com/logo.png'],
        url: 'https://acme.com',
        supportedSince: new Date('2024-03-15T12:00:00.000Z'),
      },
    })
  })

  it('converts empty url string to null on update', async () => {
    await updateSponsor({ ...VALID_SPONSOR_INPUT, id: VALID_UUID, url: '' })

    const updateArg = mockSponsorUpdate.mock.calls[0][0]
    expect(updateArg.data.url).toBeNull()
  })

  it('returns validation error for invalid sponsor id', async () => {
    const result = await updateSponsor({
      ...VALID_SPONSOR_INPUT,
      id: 'not-a-uuid',
    })

    expect(result.success).toBe(false)
    expect(result.message).toBe('Validation error')
  })

  it('returns Internal server error when prisma update throws', async () => {
    mockSponsorUpdate.mockRejectedValue(new Error('DB error'))

    const result = await updateSponsor({
      ...VALID_SPONSOR_INPUT,
      id: VALID_UUID,
    })

    expect(result).toEqual({ success: false, message: 'Internal server error' })
  })
})

// ---------------------------------------------------------------------------
// deleteSponsor
// ---------------------------------------------------------------------------

describe('deleteSponsor', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetSession.mockResolvedValue(ADMIN_SESSION)
    mockSponsorDelete.mockResolvedValue({})
  })

  it('returns Unauthorized when not authenticated', async () => {
    mockGetSession.mockResolvedValue(null)

    expect(await deleteSponsor({ id: VALID_UUID })).toEqual({
      success: false,
      message: 'Unauthorized',
    })
  })

  it('returns Unauthorized for non-admin role', async () => {
    mockGetSession.mockResolvedValue({
      user: { id: 'user-1', role: Role.USER },
      session: {},
    })

    expect(await deleteSponsor({ id: VALID_UUID })).toEqual({
      success: false,
      message: 'Unauthorized',
    })
  })

  it('deletes a sponsor and returns success', async () => {
    const result = await deleteSponsor({ id: VALID_UUID })

    expect(result).toEqual({
      success: true,
      message: 'Le sponsor a été supprimé.',
    })
    expect(mockSponsorDelete).toHaveBeenCalledWith({
      where: { id: VALID_UUID },
    })
  })

  it('calls revalidateTag with the sponsors tag', async () => {
    await deleteSponsor({ id: VALID_UUID })

    expect(mockRevalidateTag).toHaveBeenCalledWith('sponsors', 'hours')
  })

  it('returns validation error for invalid UUID', async () => {
    const result = await deleteSponsor({ id: 'bad-id' })

    expect(result.success).toBe(false)
    expect(result.message).toBe('Validation error')
  })

  it('returns a Prisma error message for P2025 (record not found)', async () => {
    const { Prisma } = await import('@/prisma/generated/prisma/client')
    mockSponsorDelete.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('not found', {
        code: 'P2025',
        clientVersion: '7.0.0',
      }),
    )

    const result = await deleteSponsor({ id: VALID_UUID })

    expect(result).toEqual({ success: false, message: 'Record not found.' })
  })
})
