/**
 * File: app/(public)/error.tsx
 * Description: Error boundary for the public route segment.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

'use client'

import { AlertTriangle, ArrowLeft, RotateCcw } from 'lucide-react'
import Link from 'next/link'
import posthog from 'posthog-js'
import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { ROUTES } from '@/lib/config/routes'

interface ErrorPageProps {
  error: Error & { digest?: string }
  reset: () => void
}

/** Public-segment error boundary — retry or navigate home. */
const PublicErrorPage = ({ error, reset }: ErrorPageProps) => {
  useEffect(() => {
    console.error(error)
    posthog.captureException(error)
  }, [error])

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-zinc-950 px-4 text-zinc-50">
      <div className="flex size-16 items-center justify-center rounded-full bg-red-500/10 ring-1 ring-red-500/20">
        <AlertTriangle className="size-8 text-red-400" />
      </div>
      <div className="text-center">
        <h1 className="text-2xl font-bold tracking-tight">
          Oops, quelque chose s&apos;est mal passé
        </h1>
        <p className="mt-2 text-sm text-zinc-400">
          Une erreur inattendue s&apos;est produite sur cette page.
        </p>
        <p className="mt-1 text-xs text-zinc-500">
          Notre équipe a été automatiquement informée de ce problème.
        </p>
      </div>
      <div className="flex gap-3">
        <Button asChild variant="ghost" className="text-zinc-400">
          <Link href={ROUTES.HOME}>
            <ArrowLeft className="mr-2 size-4" />
            Accueil
          </Link>
        </Button>
        <Button
          onClick={reset}
          variant="outline"
          className="border-zinc-700 bg-zinc-900 hover:bg-zinc-800"
        >
          <RotateCcw className="mr-2 size-4" />
          Réessayer
        </Button>
      </div>
    </div>
  )
}

export default PublicErrorPage
