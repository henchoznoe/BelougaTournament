/**
 * File: app/error.tsx
 * Description: Root-level React error boundary for unexpected runtime errors.
 *   Logs the error and provides a user-friendly recovery option.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

'use client'

import { AlertTriangle, RotateCcw } from 'lucide-react'
import { useEffect } from 'react'
import { Button } from '@/components/ui/button'

interface ErrorPageProps {
  error: Error & { digest?: string }
  reset: () => void
}

/** Root error boundary — logs the error and lets the user retry. */
const RootErrorPage = ({ error, reset }: ErrorPageProps) => {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-zinc-950 px-4 text-zinc-50">
      <div className="flex size-16 items-center justify-center rounded-full bg-red-500/10 ring-1 ring-red-500/20">
        <AlertTriangle className="size-8 text-red-400" />
      </div>
      <div className="text-center">
        <h1 className="text-2xl font-bold tracking-tight">
          Une erreur est survenue
        </h1>
        <p className="mt-2 text-sm text-zinc-400">
          Quelque chose s&apos;est mal passé. Vous pouvez réessayer ou revenir
          plus tard.
        </p>
        {error.digest && (
          <p className="mt-1 font-mono text-xs text-zinc-600">
            Ref: {error.digest}
          </p>
        )}
      </div>
      <Button
        onClick={reset}
        variant="outline"
        className="border-zinc-700 bg-zinc-900 hover:bg-zinc-800"
      >
        <RotateCcw className="mr-2 size-4" />
        Réessayer
      </Button>
    </div>
  )
}

export default RootErrorPage
