/**
 * File: next.config.ts
 * Description: Next.js configuration options.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import type { NextConfig } from 'next'

// Content Security Policy — allows Twitch player, Discord CDN, and Vercel Blob storage
const CSP_DIRECTIVES = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://player.twitch.tv",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https://*.public.blob.vercel-storage.com https://cdn.discordapp.com",
  "font-src 'self'",
  'frame-src https://player.twitch.tv',
  "connect-src 'self' https://discord.com https://player.twitch.tv",
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
  allowedDevOrigins: ['http://localhost:3000'],
  headers: async () => [
    {
      source: '/(.*)',
      headers: SECURITY_HEADERS,
    },
  ],
}

export default nextConfig
