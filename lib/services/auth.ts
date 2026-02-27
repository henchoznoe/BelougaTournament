/**
 * File: lib/services/auth.ts
 * Description: Services for handling authentication logic.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { headers } from 'next/headers'
import auth from '@/lib/core/auth'
import type { AuthSession } from '@/lib/types/auth'

/** Retrieves the typed session for the current request, or null. */
export const getSession = async (): Promise<AuthSession | null> => {
  const session = await auth.api.getSession({ headers: await headers() })
  return (session as AuthSession | null) ?? null
}
