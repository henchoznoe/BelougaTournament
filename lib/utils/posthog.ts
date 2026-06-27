/**
 * File: lib/utils/posthog.ts
 * Description: Pure helpers for the PostHog server-side integration.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

/**
 * Extracts the PostHog `distinct_id` from a request `Cookie` header so server-side
 * exceptions can be attributed to the same person as their client-side session.
 *
 * PostHog stores its state in a cookie named `ph_phc_<projectKey>_posthog`, whose
 * URL-encoded value is a JSON object containing `distinct_id`. Returns `undefined`
 * when the cookie is absent or malformed (the exception is still captured, just
 * anonymously).
 */
export const extractDistinctId = (
  cookieHeader: string | undefined,
): string | undefined => {
  if (!cookieHeader) return undefined

  const match = cookieHeader.match(/ph_phc_.*?_posthog=([^;]+)/)
  if (!match) return undefined

  try {
    const parsed = JSON.parse(decodeURIComponent(match[1])) as {
      distinct_id?: unknown
    }
    return typeof parsed.distinct_id === 'string'
      ? parsed.distinct_id
      : undefined
  } catch {
    return undefined
  }
}
