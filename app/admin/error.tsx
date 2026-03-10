/**
 * File: app/admin/error.tsx
 * Description: Error boundary for the admin route segment.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

'use client'

import { AlertTriangle, ArrowLeft, RotateCcw } from 'lucide-react'
import Link from 'next/link'
import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { ROUTES } from '@/lib/config/routes'

interface ErrorPageProps {
  error: Error & { digest?: string }
  reset: () => void
}

/** Admin-segment error boundary — retry or navigate to admin dashboard. */
const AdminErrorPage = ({ error, reset }: ErrorPageProps) => {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 px-4 text-zinc-50">
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
        {error.digest && (
          <p className="mt-1 font-mono text-xs text-zinc-600">
            Digest : {error.digest}
          </p>
        )}
      </div>
      <div className="flex gap-3">
        <Button asChild variant="ghost" className="text-zinc-400">
          <Link href={ROUTES.ADMIN_DASHBOARD}>
            <ArrowLeft className="mr-2 size-4" />
            Tableau de bord
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

export default AdminErrorPage
