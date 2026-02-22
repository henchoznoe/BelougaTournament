/**
 * File: app/api/sentry-test/route.ts
 * Description: Temporary route to verify Sentry error tracking is working.
 *   DELETE THIS FILE after confirming errors appear in the Sentry dashboard.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import * as Sentry from '@sentry/nextjs'
import { NextResponse } from 'next/server'

/** GET /api/sentry-test — captures a test exception in Sentry. */
export const GET = async () => {
  Sentry.captureException(
    new Error('[Sentry Test] Error tracking is working correctly.'),
  )

  return NextResponse.json({
    sent: true,
    message: 'Test error sent to Sentry. Check your dashboard.',
  })
}
