/**
 * File: instrumentation.ts
 * Description: Next.js server instrumentation — forwards uncaught server-side
 *   errors (RSC, route handlers, SSR) to PostHog via the onRequestError hook.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import type { Instrumentation } from 'next'

export const register = (): void => {}

export const onRequestError: Instrumentation.onRequestError = async (
  err,
  request,
) => {
  // posthog-node is Node-only; never load it in the edge runtime.
  if (process.env.NEXT_RUNTIME !== 'nodejs') return

  const { captureServerException } = await import('@/lib/core/posthog')
  const { extractDistinctId } = await import('@/lib/utils/posthog')

  // The Cookie header is typed as string | string[]; normalize to a single string.
  const cookie = request.headers.cookie
  const cookieHeader = Array.isArray(cookie) ? cookie.join('; ') : cookie

  await captureServerException(err, extractDistinctId(cookieHeader), {
    source: 'next-onRequestError',
    path: request.path,
  })
}
