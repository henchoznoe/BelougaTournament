/**
 * File: sentry.edge.config.ts
 * Description: Sentry SDK initialisation for the edge runtime.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import * as Sentry from '@sentry/nextjs';

const TRACE_RATE_PROD = 0.1;
const TRACE_RATE_DEFAULT = 1.0;

const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,

  tracesSampleRate: isProduction ? TRACE_RATE_PROD : TRACE_RATE_DEFAULT,

  enableLogs: true,
  sendDefaultPii: true,

  // Disable in development
  enabled: !isDevelopment,
});
