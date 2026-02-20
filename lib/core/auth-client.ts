/**
 * File: lib/auth-client.ts
 * Description: Authentication client configuration using Better Auth.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { createAuthClient } from 'better-auth/react'
import { env } from '@/lib/core/env'

export const authClient = createAuthClient({
  baseURL: env.NEXT_PUBLIC_APP_URL,
})
