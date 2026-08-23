/**
 * File: app/sitemap.ts
 * Description: Dynamic sitemap generation for search engine indexation.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import type { MetadataRoute } from 'next'
import { cacheLife, cacheTag } from 'next/cache'
import { CACHE_TAGS } from '@/lib/config/constants'
import { env } from '@/lib/core/env'
import { getTournamentSitemapEntries } from '@/lib/services/sitemap'

const sitemap = async (): Promise<MetadataRoute.Sitemap> => {
  'use cache'
  cacheLife('days')
  cacheTag(CACHE_TAGS.TOURNAMENTS_SITEMAP)

  const baseUrl = env.NEXT_PUBLIC_APP_URL

  // Static public routes
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: baseUrl, changeFrequency: 'weekly', priority: 1 },
    { url: `${baseUrl}/tournaments`, changeFrequency: 'daily', priority: 0.9 },
    {
      url: `${baseUrl}/tournaments/archive`,
      changeFrequency: 'weekly',
      priority: 0.6,
    },
    { url: `${baseUrl}/stream`, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${baseUrl}/players`, changeFrequency: 'daily', priority: 0.7 },
    { url: `${baseUrl}/contact`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/legal`, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${baseUrl}/privacy`, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${baseUrl}/terms`, changeFrequency: 'yearly', priority: 0.3 },
  ]

  // Dynamic tournament routes (PUBLISHED + ARCHIVED)
  const tournaments = await getTournamentSitemapEntries()
  const tournamentRoutes: MetadataRoute.Sitemap = tournaments.map(t => ({
    url: `${baseUrl}/tournaments/${t.slug}`,
    lastModified: t.updatedAt,
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))

  return [...staticRoutes, ...tournamentRoutes]
}

export default sitemap
