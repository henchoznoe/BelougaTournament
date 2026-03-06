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
vi.mock('@/lib/core/prisma', () => ({
  default: {
    sponsor: { findMany: (...args: unknown[]) => mockFindMany(...args) },
  },
}))

// ---------------------------------------------------------------------------
// Module under test
// ---------------------------------------------------------------------------

const { getSponsors } = await import('@/lib/services/sponsors')

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

  it('returns sponsors ordered by supportedSince field', async () => {
    mockFindMany.mockResolvedValue(MOCK_SPONSORS)

    const result = await getSponsors()

    expect(result).toEqual(MOCK_SPONSORS)
    expect(mockFindMany).toHaveBeenCalledWith({
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
