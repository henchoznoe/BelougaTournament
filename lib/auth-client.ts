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

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
})
