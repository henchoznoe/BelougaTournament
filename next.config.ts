/**
 * File: next.config.ts
 * Description: Next.js configuration options.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    // To allow belouga logo upload
    // TODO: Look if this is the best way to do it
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.public.blob.vercel-storage.com',
        port: '',
      },
    ],
  },
  experimental: {
    serverActions: {
      // To allow belouga logo upload
      // TODO: Look if this is the best way to do it
      bodySizeLimit: '5mb',
    },
  },
}

export default nextConfig
