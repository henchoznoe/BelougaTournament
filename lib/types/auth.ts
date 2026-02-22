/**
 * File: lib/types/auth.ts
 * Description: Shared BetterAuth session types used by the edge proxy and server components.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import type { Role } from '@/prisma/generated/prisma/enums'

/** Shape of the BetterAuth session object returned by `/api/auth/get-session`. */
export type AuthSession = {
  session: {
    id: string
    userId: string
    expiresAt: string | Date
    token: string
  }
  user: {
    id: string
    email: string
    name: string
    role: Role
    image?: string | null
    discordId?: string | null
  }
}
