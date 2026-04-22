/**
 * File: app/(public)/unauthorized/page.tsx
 * Description: Unauthorized access page shown when a user lacks permissions.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { ArrowLeft, ShieldOff } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ROUTES } from '@/lib/config/routes'

/** Rendered when an authenticated user tries to access a route they are not authorized for. */
const UnauthorizedPage = () => {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-zinc-950 px-4 text-zinc-50">
      <div className="flex size-16 items-center justify-center rounded-full bg-orange-500/10 ring-1 ring-orange-500/20">
        <ShieldOff className="size-8 text-orange-400" />
      </div>
      <div className="text-center">
        <h1 className="text-2xl font-bold tracking-tight">Accès refusé</h1>
        <p className="mt-2 text-sm text-zinc-400">
          Vous n&apos;avez pas les permissions nécessaires pour accéder à cette
          page.
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

export default UnauthorizedPage
