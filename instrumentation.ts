/**
 * File: instrumentation.ts
 * Description: Next.js server-side instrumentation hook. Registers Sentry for both
 *   Node.js and Edge runtimes, and exports onRequestError to capture unhandled request errors.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

export async function register() {
  /* v8 ignore next 3 */
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config')
  }
  /* v8 ignore next 3 */
  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config')
  }
}

export { captureRequestError as onRequestError } from '@sentry/nextjs'
