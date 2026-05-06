/**
 * File: sentry.edge.config.ts
 * Description: Sentry initialization for the Edge runtime (middleware, edge routes).
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  enabled: process.env.VERCEL_ENV === 'production',
  environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV,
  tracesSampleRate: 0.1,
  enableLogs: true,
  sendDefaultPii: true,
})
