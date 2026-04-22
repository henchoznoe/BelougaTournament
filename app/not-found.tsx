/**
 * File: app/not-found.tsx
 * Description: 404 Not Found page.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ROUTES } from '@/lib/config/routes'

const NotFoundPage = () => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-zinc-950 px-4 text-zinc-50">
      <p className="select-none font-mono text-8xl font-bold text-zinc-800">
        404
      </p>
      <div className="text-center">
        <h1 className="text-2xl font-bold tracking-tight">Page introuvable</h1>
        <p className="mt-2 text-sm text-zinc-400">
          La page que vous cherchez n&apos;existe pas ou a été déplacée.
        </p>
      </div>
      <Button asChild variant="ghost" className="text-zinc-400">
        <Link href={ROUTES.HOME}>
          <ArrowLeft className="mr-2 size-4" />
          Retour à l&apos;accueil
        </Link>
      </Button>
    </div>
  )
}

export default NotFoundPage
