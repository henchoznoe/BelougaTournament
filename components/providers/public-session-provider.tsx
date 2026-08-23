/**
 * File: components/providers/public-session-provider.tsx
 * Description: Single client-side Better Auth session source shared by public UI.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

'use client'

import { createContext, useContext } from 'react'
import { authClient } from '@/lib/core/auth-client'
import type { AuthSession } from '@/lib/types/auth'

interface PublicSessionContextValue {
  isPending: boolean
  sessionUser: AuthSession['user'] | null
}

const PublicSessionContext = createContext<PublicSessionContextValue | null>(
  null,
)

export const PublicSessionProvider = ({
  children,
}: Readonly<{ children: React.ReactNode }>) => {
  const { data, isPending } = authClient.useSession()
  const sessionUser = (data?.user as AuthSession['user'] | undefined) ?? null

  return (
    <PublicSessionContext.Provider value={{ isPending, sessionUser }}>
      {children}
    </PublicSessionContext.Provider>
  )
}

export const usePublicSession = (): PublicSessionContextValue => {
  const context = useContext(PublicSessionContext)
  if (!context) {
    throw new Error(
      'usePublicSession must be used within PublicSessionProvider',
    )
  }
  return context
}
