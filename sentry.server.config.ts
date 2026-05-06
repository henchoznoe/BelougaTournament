/**
 * File: sentry.server.config.ts
 * Description: Sentry initialization for the Node.js server runtime.
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
  includeLocalVariables: true,
  enableLogs: true,
  sendDefaultPii: true,
})
