'use client'

import * as Sentry from '@sentry/nextjs'
import { useState } from 'react'
import { Button } from '@/components/ui/button'

/**
 * Copyright 2026
 * Title: Sentry Test Component
 * Author(s): AI
 * Creation Date: 2026-02-24
 * Last Modification Date: 2026-02-24
 */

export function SentryTestComponent() {
  const [shouldRenderError, setShouldRenderError] = useState(false)

  // 1. Render Error: This completely breaks the React tree and usually gets caught
  // by error boundaries or Next.js global error handlers, which pass it to Sentry.
  if (shouldRenderError) {
    throw new Error('Critical Render Error (Sentry Test)')
  }

  /**
   * Triggers an unhandled exception in an event handler.
   */
  const handleUnhandledError = () => {
    throw new Error('Critical Unhandled Client Error (Sentry Test)')
  }

  /**
   * Manually captures an exception and enforces the 'fatal' severity level.
   * This guarantees Sentry will receive it and classify it as critical.
   */
  const handleFatalCapture = () => {
    try {
      throw new Error('Critical Manually Captured Fatal Error (Sentry Test)')
    } catch (error) {
      Sentry.captureException(error, {
        level: 'fatal',
      })
    }
  }

  /**
   * Triggers a render error by updating the component state.
   */
  const triggerRenderError = () => {
    setShouldRenderError(true)
  }

  return (
    <div className="p-6 border-2 border-red-500 bg-red-500/10 rounded-xl space-y-4 max-w-md">
      <h2 className="text-xl font-bold text-red-600">
        Sentry Critical Testing
      </h2>
      <p className="text-sm text-foreground mb-4">
        Try these three different types of errors to see which ones get caught
        by your Sentry configuration.
      </p>

      <div className="flex flex-col gap-3">
        <Button variant="destructive" onClick={handleUnhandledError}>
          1. Throw Unhandled Handler Error
        </Button>

        <Button variant="destructive" onClick={triggerRenderError}>
          2. Throw React Render Error
        </Button>

        <Button variant="destructive" onClick={handleFatalCapture}>
          3. Capture Manual 'Fatal' Error
        </Button>
      </div>
    </div>
  )
}
