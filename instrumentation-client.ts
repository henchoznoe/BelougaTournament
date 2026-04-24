/**
 * File: instrumentation-client.ts
 * Description: Client-side PostHog initialization for Next.js 15.3+.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import posthog from 'posthog-js'

// Only initialize PostHog in production to avoid polluting analytics with
// dev/preview events and to prevent Discord webhook spam from non-prod errors.
if (process.env.NEXT_PUBLIC_VERCEL_ENV === 'production') {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN ?? '', {
    api_host: '/ingest',
    ui_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    defaults: '2026-01-30',
    capture_pageview: false,
    capture_exceptions: true,
  })
}
