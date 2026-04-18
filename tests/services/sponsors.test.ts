/**
 * File: tests/services/sponsors.test.ts
 * Description: Unit tests for the sponsors service.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock('next/cache', () => ({ cacheLife: vi.fn(), cacheTag: vi.fn() }))
vi.mock('server-only', () => ({}))
vi.mock('@/lib/core/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))

const mockFindMany = vi.fn()
const mockFindUnique = vi.fn()
vi.mock('@/lib/core/prisma', () => ({
  default: {
    sponsor: {
      findMany: (...args: unknown[]) => mockFindMany(...args),
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
    },
  },
}))

// ---------------------------------------------------------------------------
// Module under test
// ---------------------------------------------------------------------------

const { getSponsors, getAllSponsors, getSponsorById } = await import(
  '@/lib/services/sponsors'
)

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const MOCK_SPONSORS = [
  {
    id: 'uuid-1',
    name: 'Sponsor A',
    imageUrls: ['https://a.com/logo.png'],
    url: null,
    supportedSince: new Date('2023-01-15T12:00:00.000Z'),
  },
  {
    id: 'uuid-2',
    name: 'Sponsor B',
    imageUrls: ['https://b.com/logo.png'],
    url: 'https://b.com',
    supportedSince: new Date('2024-03-10T12:00:00.000Z'),
  },
]

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('getSponsors', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns only enabled sponsors ordered by supportedSince asc', async () => {
    mockFindMany.mockResolvedValue(MOCK_SPONSORS)

    const result = await getSponsors()

    expect(result).toEqual(MOCK_SPONSORS)
    expect(mockFindMany).toHaveBeenCalledWith({
      where: { enabled: true },
      orderBy: { supportedSince: 'asc' },
    })
  })

  it('returns an empty array when no sponsors exist', async () => {
    mockFindMany.mockResolvedValue([])

    const result = await getSponsors()

    expect(result).toEqual([])
  })

  it('returns an empty array on database error', async () => {
    mockFindMany.mockRejectedValue(new Error('DB error'))

    const result = await getSponsors()

    expect(result).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// getAllSponsors
// ---------------------------------------------------------------------------

describe('getAllSponsors', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns all sponsors ordered by supportedSince desc', async () => {
    mockFindMany.mockResolvedValue(MOCK_SPONSORS)

    const result = await getAllSponsors()

    expect(result).toEqual(MOCK_SPONSORS)
    expect(mockFindMany).toHaveBeenCalledWith({
      orderBy: { supportedSince: 'desc' },
    })
  })

  it('returns an empty array when no sponsors exist', async () => {
    mockFindMany.mockResolvedValue([])

    const result = await getAllSponsors()

    expect(result).toEqual([])
  })

  it('returns an empty array on database error', async () => {
    mockFindMany.mockRejectedValue(new Error('DB error'))

    const result = await getAllSponsors()

    expect(result).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// getSponsorById
// ---------------------------------------------------------------------------

describe('getSponsorById', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns the sponsor when found', async () => {
    mockFindUnique.mockResolvedValue(MOCK_SPONSORS[0])

    const result = await getSponsorById('uuid-1')

    expect(result).toEqual(MOCK_SPONSORS[0])
    expect(mockFindUnique).toHaveBeenCalledWith({ where: { id: 'uuid-1' } })
  })

  it('returns null when sponsor is not found', async () => {
    mockFindUnique.mockResolvedValue(null)

    const result = await getSponsorById('non-existent')

    expect(result).toBeNull()
  })

  it('returns null on database error', async () => {
    mockFindUnique.mockRejectedValue(new Error('DB error'))

    const result = await getSponsorById('uuid-1')

    expect(result).toBeNull()
  })
})
