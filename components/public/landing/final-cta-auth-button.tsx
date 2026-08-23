/**
 * File: components/public/landing/final-cta-auth-button.tsx
 * Description: Auth-aware signup button isolated from the static landing CTA.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

'use client'

import Link from 'next/link'
import { usePublicSession } from '@/components/providers/public-session-provider'
import { Button } from '@/components/ui/button'
import { ROUTES } from '@/lib/config/routes'

export const FinalCtaAuthButton = () => {
  const { isPending, sessionUser } = usePublicSession()
  if (isPending || sessionUser) return null

  return (
    <Button
      asChild
      variant="outline"
      size="lg"
      className="h-14 border-white/10 bg-white/5 px-8 text-lg font-medium text-white backdrop-blur-md transition-all hover:border-brand/50 hover:bg-white/10 hover:text-brand"
    >
      <Link href={ROUTES.LOGIN}>Créer mon compte</Link>
    </Button>
  )
}
