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
    order: 1,
  },
  {
    id: 'uuid-2',
    name: 'Sponsor B',
    imageUrls: ['https://b.com/logo.png'],
    url: 'https://b.com',
    order: 2,
  },
]

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('getSponsors', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns sponsors ordered by the order field', async () => {
    mockFindMany.mockResolvedValue(MOCK_SPONSORS)

    const result = await getSponsors()

    expect(result).toEqual(MOCK_SPONSORS)
    expect(mockFindMany).toHaveBeenCalledWith({ orderBy: { order: 'asc' } })
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
