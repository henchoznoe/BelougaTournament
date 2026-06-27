/**
 * File: components/providers/posthog-provider.tsx
 * Description: Client provider wiring PostHog into React and identifying the
 *   authenticated user (links sessions/recordings to their account).
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

'use client'

import posthog from 'posthog-js'
import { PostHogProvider as PHProvider } from 'posthog-js/react'
import { useEffect } from 'react'
import { authClient } from '@/lib/core/auth-client'

/**
 * Identifies the signed-in user in PostHog so events, exceptions and session
 * recordings are attributed to their account. No-op while signed out; the reset
 * on sign-out is handled in `useLogout`.
 */
const PostHogIdentifier = () => {
  const { data } = authClient.useSession()
  const user = data?.user

  useEffect(() => {
    if (!posthog.__loaded || !user) return

    posthog.identify(user.id, {
      email: user.email,
      name: user.name,
      displayName: user.displayName,
      role: user.role,
      discordId: user.discordId,
    })
  }, [user])

  return null
}

interface PostHogProviderProps {
  children: React.ReactNode
}

export const PostHogProvider = ({ children }: PostHogProviderProps) => (
  <PHProvider client={posthog}>
    {children}
    <PostHogIdentifier />
  </PHProvider>
)
