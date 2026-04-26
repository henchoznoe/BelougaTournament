/**
 * File: tests/seo/robots-sitemap.test.ts
 * Description: Unit tests for robots.txt and sitemap.xml generation.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock('server-only', () => ({}))

const mockEnv: {
  NEXT_PUBLIC_APP_URL: string
  VERCEL_ENV: 'development' | 'preview' | 'production' | undefined
} = {
  NEXT_PUBLIC_APP_URL: 'https://belouga.test',
  VERCEL_ENV: 'production',
}
vi.mock('@/lib/core/env', () => ({ env: mockEnv }))

vi.mock('@/lib/core/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))

const mockFindMany = vi.fn()
vi.mock('@/lib/core/prisma', () => ({
  default: {
    tournament: {
      findMany: (...args: unknown[]) => mockFindMany(...args),
    },
  },
}))

// ---------------------------------------------------------------------------
// Modules under test
// ---------------------------------------------------------------------------

const { default: robots } = await import('@/app/robots')
const { default: sitemap } = await import('@/app/sitemap')

// ===========================================================================
// robots.ts
// ===========================================================================

describe('robots', () => {
  it('returns rules allowing crawling with correct disallowed paths', () => {
    const result = robots()

    expect(result.rules).toEqual([
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/login', '/profile', '/unauthorized', '/api/'],
      },
    ])
  })

  it('returns sitemap URL using configured app URL', () => {
    const result = robots()

    expect(result.sitemap).toBe('https://belouga.test/sitemap.xml')
  })

  it('blocks all crawling when VERCEL_ENV is preview', () => {
    mockEnv.VERCEL_ENV = 'preview'
    const result = robots()
    expect(result.rules).toEqual([{ userAgent: '*', disallow: '/' }])
    expect(result.sitemap).toBeUndefined()
    mockEnv.VERCEL_ENV = 'production'
  })

  it('blocks all crawling when VERCEL_ENV is undefined', () => {
    mockEnv.VERCEL_ENV = undefined as never
    const result = robots()
    expect(result.rules).toEqual([{ userAgent: '*', disallow: '/' }])
    expect(result.sitemap).toBeUndefined()
    mockEnv.VERCEL_ENV = 'production'
  })
})

// ===========================================================================
// sitemap.ts
// ===========================================================================

describe('sitemap', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFindMany.mockResolvedValue([])
  })

  it('returns all static routes with correct metadata', async () => {
    const result = await sitemap()

    const urls = result.map(r => r.url)
    expect(urls).toContain('https://belouga.test')
    expect(urls).toContain('https://belouga.test/tournaments')
    expect(urls).toContain('https://belouga.test/tournaments/archive')
    expect(urls).toContain('https://belouga.test/stream')
    expect(urls).toContain('https://belouga.test/players')
    expect(urls).toContain('https://belouga.test/contact')
    expect(urls).toContain('https://belouga.test/legal')
    expect(urls).toContain('https://belouga.test/privacy')
    expect(urls).toContain('https://belouga.test/terms')
  })

  it('assigns correct priority to static routes', async () => {
    const result = await sitemap()

    const home = result.find(r => r.url === 'https://belouga.test')
    expect(home?.priority).toBe(1)

    const tournaments = result.find(
      r => r.url === 'https://belouga.test/tournaments',
    )
    expect(tournaments?.priority).toBe(0.9)

    const contact = result.find(r => r.url === 'https://belouga.test/contact')
    expect(contact?.priority).toBe(0.5)
  })

  it('includes dynamic tournament routes', async () => {
    const updatedAt = new Date('2026-06-01T00:00:00.000Z')
    mockFindMany.mockResolvedValue([
      { slug: 'valorant-cup', updatedAt },
      { slug: 'lol-championship', updatedAt },
    ])

    const result = await sitemap()

    // Filter to dynamic tournament detail pages (exclude /tournaments/archive which is static)
    const tournamentUrls = result.filter(
      r =>
        r.url.match(/\/tournaments\/[^/]+$/) &&
        !r.url.endsWith('/tournaments/archive'),
    )
    expect(tournamentUrls).toHaveLength(2)
    expect(tournamentUrls[0]).toEqual({
      url: 'https://belouga.test/tournaments/valorant-cup',
      lastModified: updatedAt,
      changeFrequency: 'weekly',
      priority: 0.8,
    })
    expect(tournamentUrls[1]).toEqual({
      url: 'https://belouga.test/tournaments/lol-championship',
      lastModified: updatedAt,
      changeFrequency: 'weekly',
      priority: 0.8,
    })
  })

  it('queries only PUBLISHED and ARCHIVED tournaments', async () => {
    await sitemap()

    expect(mockFindMany).toHaveBeenCalledWith({
      where: { status: { in: ['PUBLISHED', 'ARCHIVED'] } },
      select: { slug: true, updatedAt: true },
    })
  })

  it('returns only static routes when no tournaments exist', async () => {
    mockFindMany.mockResolvedValue([])

    const result = await sitemap()

    // 9 static routes, 0 dynamic
    expect(result).toHaveLength(9)
  })

  it('returns only static routes on database error', async () => {
    mockFindMany.mockRejectedValue(new Error('DB error'))

    const result = await sitemap()

    // Should gracefully degrade to static routes only
    expect(result).toHaveLength(9)
    const urls = result.map(r => r.url)
    expect(urls).not.toContain(expect.stringMatching(/\/tournaments\/[^/]+$/))
  })
})
