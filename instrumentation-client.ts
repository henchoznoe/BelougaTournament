/**
 * File: instrumentation-client.ts
 * Description: Client-side PostHog initialization (runs in the browser before hydration).
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import posthog from 'posthog-js'
import { POSTHOG } from '@/lib/config/constants/analytics'
import { env } from '@/lib/core/env'

// Disabled entirely in local development (`next dev` → NODE_ENV !== 'production').
// Enabled on deployed environments (production AND preview, where Vercel sets
// NODE_ENV=production) when a key is configured. To turn preview off later, remove
// NEXT_PUBLIC_POSTHOG_KEY from the Preview environment in Vercel.
if (process.env.NODE_ENV === 'production' && env.NEXT_PUBLIC_POSTHOG_KEY) {
  posthog.init(env.NEXT_PUBLIC_POSTHOG_KEY, {
    // Same-origin reverse proxy (see next.config.ts) — keeps the strict CSP intact.
    api_host: POSTHOG.INGEST_PATH,
    ui_host: POSTHOG.UI_HOST,
    // Modern defaults: history-based pageviews, web vitals, exception autocapture.
    defaults: '2025-05-24',
    // Capture uncaught browser exceptions (window.onerror + unhandledrejection).
    capture_exceptions: true,
    // Notice-only consent posture: honor Do Not Track.
    respect_dnt: true,
    // Privacy: mask every input field in session recordings.
    session_recording: {
      maskAllInputs: true,
    },
  })
}
