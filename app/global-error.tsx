/**
 * File: app/global-error.tsx
 * Description: Global error boundary that catches crashes in the root layout itself.
 *   Renders outside of the app layout, so must include <html> and <body>.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

'use client'

import * as Sentry from '@sentry/nextjs'
import { AlertTriangle, RotateCcw } from 'lucide-react'
import { useEffect } from 'react'

interface GlobalErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

/** Catches errors thrown by the root layout. Minimal HTML — no layout context available. */
const GlobalErrorPage = ({ error, reset }: GlobalErrorProps) => {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <html lang="fr-CH">
      <body className="flex min-h-screen flex-col items-center justify-center gap-6 bg-zinc-950 px-4 text-zinc-50">
        <div className="flex size-16 items-center justify-center rounded-full bg-red-500/10 ring-1 ring-red-500/20">
          <AlertTriangle className="size-8 text-red-400" />
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight">Erreur critique</h1>
          <p className="mt-2 text-sm text-zinc-400">
            L&apos;application a rencontré une erreur irrécupérable.
          </p>
        </div>
        <button
          type="button"
          onClick={reset}
          className="flex items-center gap-2 rounded-md border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm hover:bg-zinc-800"
        >
          <RotateCcw className="size-4" />
          Réessayer
        </button>
      </body>
    </html>
  )
}

export default GlobalErrorPage
