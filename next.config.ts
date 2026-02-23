/**
 * File: next.config.ts
 * Description: Next.js configuration options, wrapped with Sentry for error tracking.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { withSentryConfig } from '@sentry/nextjs'
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
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
}

export default withSentryConfig(nextConfig, {
  // Sentry project identifiers
  org: 'noe-henchoz',
  project: 'belouga-tournament',

  // Suppress Sentry CLI output outside CI
  silent: !process.env.CI,

  // Upload a larger set of source maps for prettier stack traces
  widenClientFileUpload: true,

  // Route browser requests through Next.js to avoid ad-blockers
  tunnelRoute: '/monitoring',

  webpack: {
    // Do not instrument Vercel Cron Monitors automatically to avoid deployment alerts
    automaticVercelMonitors: false,

    // Tree-shake Sentry debug logs in production webpack builds
    treeshake: {
      removeDebugLogging: true,
    },
  },
})
