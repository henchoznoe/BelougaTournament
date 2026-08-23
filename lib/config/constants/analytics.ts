/**
 * File: lib/config/constants/analytics.ts
 * Description: PostHog analytics configuration constants (EU region).
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

/**
 * PostHog (EU region) endpoints.
 *
 * Browser and server ingestion connect directly to the EU endpoint so analytics
 * traffic does not consume Vercel Edge requests. UI_HOST is only used for links.
 */
export const POSTHOG = {
  /** PostHog EU ingestion host. */
  API_HOST: 'https://eu.i.posthog.com',
  /** PostHog EU static assets host. */
  ASSETS_HOST: 'https://eu-assets.i.posthog.com',
  /** PostHog EU app host — links/toolbar only, never for connections. */
  UI_HOST: 'https://eu.posthog.com',
} as const
