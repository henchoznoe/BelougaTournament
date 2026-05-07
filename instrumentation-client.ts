/**
 * File: instrumentation-client.ts
 * Description: Client-side instrumentation for Next.js 15.3+. Initializes Sentry for
 *   error monitoring, tracing, session replay, and structured logging in the browser.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  enabled: process.env.NODE_ENV === 'production',
  environment: process.env.NEXT_PUBLIC_VERCEL_ENV ?? process.env.NODE_ENV,
  tracesSampleRate: 0.1,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  enableLogs: true,
  sendDefaultPii: true,
  integrations: [Sentry.replayIntegration()],
})

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart

// Suppress benign ResizeObserver loop errors that trigger false-positive alerts.
// These occur naturally when field-sizing-content textareas resize across frames.
window.addEventListener('error', event => {
  if (event.message?.includes('ResizeObserver loop')) {
    event.stopImmediatePropagation()
  }
})
