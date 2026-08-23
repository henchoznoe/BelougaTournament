/**
 * File: components/providers/posthog-provider.tsx
 * Description: Client provider wiring PostHog into React and identifying the
 *   authenticated user (links sessions/recordings to their account).
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

'use client'

import { useEffect } from 'react'
import { usePublicSession } from '@/components/providers/public-session-provider'
import { env } from '@/lib/core/env'
import {
  initializePostHogBrowser,
  posthogBrowser,
} from '@/lib/utils/posthog-browser'

/**
 * Identifies the signed-in user in PostHog so events, exceptions and session
 * recordings are attributed to their account. No-op while signed out; the reset
 * on sign-out is handled in `useLogout`.
 */
const PostHogIdentifier = () => {
  const { sessionUser: user } = usePublicSession()

  useEffect(() => {
    if (
      process.env.NEXT_PUBLIC_VERCEL_ENV !== 'production' ||
      !env.NEXT_PUBLIC_POSTHOG_KEY
    ) {
      return
    }

    initializePostHogBrowser(env.NEXT_PUBLIC_POSTHOG_KEY)
    if (!user) return

    const identify = () => {
      posthogBrowser.identify(user.id, {
        email: user.email,
        name: user.name,
        displayName: user.displayName,
        role: user.role,
        discordId: user.discordId,
      })
    }
    identify()
  }, [user])

  return null
}

interface PostHogProviderProps {
  children: React.ReactNode
}

export const PostHogProvider = ({ children }: PostHogProviderProps) => (
  <>
    {children}
    <PostHogIdentifier />
  </>
)
