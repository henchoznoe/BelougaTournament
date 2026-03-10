/**
 * File: app/robots.ts
 * Description: Robots.txt configuration for search engine crawling control.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import type { MetadataRoute } from 'next'
import { env } from '@/lib/core/env'

const robots = (): MetadataRoute.Robots => ({
  rules: [
    {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/login', '/profile', '/unauthorized', '/api/'],
    },
  ],
  sitemap: `${env.NEXT_PUBLIC_APP_URL}/sitemap.xml`,
})

export default robots
