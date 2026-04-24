/**
 * File: components/admin/hooks/use-logout.ts
 * Description: Shared hook encapsulating BetterAuth sign-out with toast feedback.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

'use client'

import posthog from 'posthog-js'
import { toast } from 'sonner'
import { authClient } from '@/lib/core/auth-client'

interface UseLogoutOptions {
  /** Called after a successful sign-out (e.g. redirect or refresh). */
  onSuccess?: () => void
}

/**
 * Returns a `handleLogout` callback that signs the current user out via
 * BetterAuth and shows toast notifications for success/failure.
 */
export const useLogout = ({ onSuccess }: UseLogoutOptions = {}) => {
  const handleLogout = async (): Promise<void> => {
    try {
      await authClient.signOut({
        fetchOptions: {
          onSuccess: () => {
            posthog.reset()
            toast.success('Déconnexion réussie')
            onSuccess?.()
          },
          onError: ctx => {
            console.error('Logout error:', ctx.error)
            toast.error('Erreur lors de la déconnexion')
          },
        },
      })
    } catch (error) {
      console.error('Unexpected logout error:', error)
      toast.error('Une erreur inattendue est survenue')
    }
  }

  return { handleLogout }
}
