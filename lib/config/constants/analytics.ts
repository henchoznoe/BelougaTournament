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
 * Client ingestion goes through the same-origin reverse proxy (`INGEST_PATH`)
 * configured in `next.config.ts`, which keeps the strict CSP unchanged and
 * mitigates ad-blockers. `API_HOST` / `ASSETS_HOST` are the proxy targets and
 * are also used directly by the server-side `posthog-node` client (which cannot
 * use a relative path). `UI_HOST` is only used to generate links to the PostHog
 * app (e.g. the toolbar) — never for network requests.
 */
export const POSTHOG = {
  /** Same-origin reverse-proxy path (see next.config.ts rewrites). Client ingestion. */
  INGEST_PATH: '/ingest',
  /** PostHog EU ingestion host — server-side (posthog-node) and proxy target. */
  API_HOST: 'https://eu.i.posthog.com',
  /** PostHog EU assets host — proxy target for /ingest/static. */
  ASSETS_HOST: 'https://eu-assets.i.posthog.com',
  /** PostHog EU app host — links/toolbar only, never for connections. */
  UI_HOST: 'https://eu.posthog.com',
} as const
