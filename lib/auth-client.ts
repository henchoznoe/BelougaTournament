/**
 * File: lib/auth-client.ts
 * Description: Authentication client configuration using Better Auth.
 * Author: Noé Henchoz
 * Date: 2025-12-08
 * License: MIT
 */

// ----------------------------------------------------------------------
// IMPORTS
// ----------------------------------------------------------------------

import { createAuthClient } from 'better-auth/react'
import { env } from './env'

export const authClient = createAuthClient({
  baseURL: env.NEXT_PUBLIC_APP_URL,
})
