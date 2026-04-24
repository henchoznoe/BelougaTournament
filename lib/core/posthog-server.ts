/**
 * File: lib/core/posthog-server.ts
 * Description: Server-side PostHog client for capturing events from API routes and Server Actions.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { PostHog } from 'posthog-node'

/** No-op client used outside production so call sites need no conditional logic. */
const noopClient = {
  capture: () => {},
  shutdown: () => Promise.resolve(),
} as unknown as PostHog

export const getPostHogClient = (): PostHog => {
  if (process.env.VERCEL_ENV !== 'production') {
    return noopClient
  }
  const token = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN
  if (!token) throw new Error('NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN is not set')
  return new PostHog(token, {
    host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    flushAt: 1,
    flushInterval: 0,
  })
}
