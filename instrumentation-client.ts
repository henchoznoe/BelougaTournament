/**
 * File: instrumentation-client.ts
 * Description: Sentry SDK initialisation for the client (browser).
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import * as Sentry from "@sentry/nextjs";

const TRACE_RATE_PROD = 0.1;
const TRACE_RATE_DEFAULT = 1.0;

const isProduction = process.env.NODE_ENV === 'production';
const isDevelopment = process.env.NODE_ENV === 'development';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  integrations: [Sentry.replayIntegration()],
  tracesSampleRate: isProduction ? TRACE_RATE_PROD : TRACE_RATE_DEFAULT,
  enableLogs: true,
  sendDefaultPii: true,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  enabled: !isDevelopment,
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
