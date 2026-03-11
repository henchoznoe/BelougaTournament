/**
 * File: lib/utils/owner.ts
 * Description: Server-only helper to check if a user is a platform owner.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import 'server-only'
import { env } from '@/lib/core/env'

/** Returns true if the given email belongs to a platform owner. */
export const isOwner = (email: string): boolean => {
  return env.OWNER_EMAILS.includes(email)
}
