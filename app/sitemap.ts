/**
 * File: app/sitemap.ts
 * Description: Dynamic sitemap generation for search engine indexation.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import type { MetadataRoute } from 'next'
import { env } from '@/lib/core/env'
import { logger } from '@/lib/core/logger'
import prisma from '@/lib/core/prisma'

const sitemap = async (): Promise<MetadataRoute.Sitemap> => {
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
    { url: `${baseUrl}/classement`, changeFrequency: 'daily', priority: 0.7 },
    { url: `${baseUrl}/contact`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/legal`, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${baseUrl}/privacy`, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${baseUrl}/terms`, changeFrequency: 'yearly', priority: 0.3 },
  ]

  // Dynamic tournament routes (PUBLISHED + ARCHIVED)
  let tournamentRoutes: MetadataRoute.Sitemap = []
  try {
    const tournaments = await prisma.tournament.findMany({
      where: { status: { in: ['PUBLISHED', 'ARCHIVED'] } },
      select: { slug: true, updatedAt: true },
    })

    tournamentRoutes = tournaments.map(t => ({
      url: `${baseUrl}/tournaments/${t.slug}`,
      lastModified: t.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }))
  } catch (error) {
    logger.error({ error }, 'Failed to fetch tournaments for sitemap')
  }

  return [...staticRoutes, ...tournamentRoutes]
}

export default sitemap
