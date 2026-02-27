import { withSentryConfig } from '@sentry/nextjs'
/**
 * File: next.config.ts
 * Description: Next.js configuration options.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  cacheComponents: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.public.blob.vercel-storage.com',
        port: '',
      },
      {
        protocol: 'https',
        hostname: 'cdn.discordapp.com',
        port: '',
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '5mb',
    },
  },
  allowedDevOrigins: ['http://localhost:3000'],
}

export default withSentryConfig(nextConfig, {
  org: 'noe-henchoz',
  project: 'belouga-tournament',
  silent: !process.env.CI,
  widenClientFileUpload: true,
  tunnelRoute: '/monitoring',

  webpack: {
    automaticVercelMonitors: true,
    treeshake: {
      removeDebugLogging: true,
    },
  },
})
