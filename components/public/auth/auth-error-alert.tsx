/**
 * File: components/public/auth/auth-error-alert.tsx
 * Description: Accessible, persistent feedback for OAuth callback failures on any page.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

'use client'

import { CircleAlert } from 'lucide-react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  getAuthErrorMessage,
  getLoginErrorUrl,
} from '@/lib/utils/auth-redirect'

export const AuthErrorAlert = () => {
  const searchParams = useSearchParams()
  const message = getAuthErrorMessage(searchParams.get('error'))
  if (!message) return null

  return (
    <div
      role="alert"
      className="fixed inset-x-4 bottom-4 z-50 mx-auto flex max-w-xl items-start gap-3 rounded-xl border border-red-400/40 bg-red-950/95 p-4 text-white shadow-xl backdrop-blur-sm"
    >
      <CircleAlert
        aria-hidden="true"
        className="mt-0.5 size-5 shrink-0 text-red-300"
      />
      <div className="space-y-2">
        <p className="font-semibold">La connexion n’a pas abouti.</p>
        <p className="text-sm text-red-100">{message}</p>
        <Button asChild size="sm" variant="secondary">
          <Link href={getLoginErrorUrl(searchParams.get('from') ?? '/')}>
            Réessayer la connexion
          </Link>
        </Button>
      </div>
    </div>
  )
}
