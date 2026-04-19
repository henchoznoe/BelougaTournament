/**
 * File: lib/utils/verify-admin.ts
 * Description: Helper to verify that an incoming request is from an authenticated admin.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import 'server-only'
import auth from '@/lib/core/auth'
import { Role } from '@/prisma/generated/prisma/enums'

/** Returns the session if the request comes from an authenticated admin, otherwise null. */
export const verifyAdmin = async (request: Request) => {
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session?.user || session.user.role !== Role.ADMIN) {
    return null
  }
  return session
}
