/**
 * File: lib/core/posthog.ts
 * Description: Server-side PostHog client (posthog-node) for exception capture.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import 'server-only'
import { PostHog } from 'posthog-node'
import { POSTHOG } from '@/lib/config/constants/analytics'
import { env } from '@/lib/core/env'

let client: PostHog | null = null

/**
 * Returns a lazily-instantiated singleton PostHog server client, or `null` when
 * analytics is disabled. Disabled in local dev/test (NODE_ENV !== 'production')
 * and whenever no project key is configured, so it is a no-op outside deployed
 * environments (production and preview).
 *
 * `flushAt: 1` / `flushInterval: 0` send events immediately, which suits the
 * short-lived serverless functions on Vercel.
 */
export const getPostHogServer = (): PostHog | null => {
  if (env.NODE_ENV !== 'production' || !env.NEXT_PUBLIC_POSTHOG_KEY) return null
  if (!client) {
    client = new PostHog(env.NEXT_PUBLIC_POSTHOG_KEY, {
      host: POSTHOG.API_HOST,
      flushAt: 1,
      flushInterval: 0,
    })
  }
  return client
}

/**
 * Captures a server-side exception in PostHog, attributing it to `distinctId`
 * when known. No-ops when PostHog is not configured. Awaits a flush so the event
 * is delivered before the serverless invocation terminates.
 */
export const captureServerException = async (
  error: unknown,
  distinctId?: string,
  context?: Record<string, unknown>,
): Promise<void> => {
  const ph = getPostHogServer()
  if (!ph) return

  ph.captureException(
    error instanceof Error ? error : new Error(String(error)),
    distinctId,
    context,
  )
  await ph.flush()
}
