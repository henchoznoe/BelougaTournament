/**
 * File: next.config.ts
 * Description: Next.js configuration options.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import type { NextConfig } from 'next'

// Content Security Policy — allows Twitch, immutable media hosts, and direct PostHog EU ingestion.
const CSP_DIRECTIVES = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://player.twitch.tv https://eu-assets.i.posthog.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https://*.public.blob.vercel-storage.com https://cdn.discordapp.com",
  "font-src 'self'",
  'frame-src https://player.twitch.tv https://widget.toornament.com',
  "connect-src 'self' https://discord.com https://player.twitch.tv https://eu.i.posthog.com https://eu-assets.i.posthog.com",
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join('; ')

const SECURITY_HEADERS = [
  { key: 'Content-Security-Policy', value: CSP_DIRECTIVES },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()',
  },
]

const nextConfig: NextConfig = {
  cacheComponents: true,
  // isomorphic-dompurify loads jsdom on the server. Keeping the package external
  // preserves jsdom's runtime assets instead of relocating them into a webpack
  // chunk where its relative browser/default-stylesheet.css path no longer exists.
  serverExternalPackages: ['isomorphic-dompurify'],
  env: {
    NEXT_PUBLIC_VERCEL_ENV: process.env.VERCEL_ENV ?? 'development',
  },
  images: {
    minimumCacheTTL: 31_536_000,
    deviceSizes: [360, 640, 768, 1024, 1280, 1536],
    imageSizes: [32, 48, 64, 96, 128, 256],
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
  allowedDevOrigins: ['http://localhost:3000'],
  headers: async () => [
    {
      source: '/(.*)',
      headers: SECURITY_HEADERS,
    },
  ],
}

export default nextConfig
