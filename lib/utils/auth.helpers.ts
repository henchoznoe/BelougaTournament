/**
 * File: lib/utils/auth.helpers.ts
 * Description: Pure helper functions for authentication role checks.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { Role } from '@/prisma/generated/prisma/enums'

/** Returns true if the given role has admin privileges. */
export const isAdmin = (role: Role): boolean => {
  return role === Role.ADMIN
}

/** Returns true if the user is currently banned (bannedUntil is in the future). */
export const isBanned = (bannedUntil: Date | string | null): boolean => {
  if (!bannedUntil) return false
  return new Date(bannedUntil) > new Date()
}

/** Returns true if the ban date represents a permanent ban (year >= 9999). */
export const isPermanentBan = (bannedUntil: Date | string | null): boolean => {
  return !!bannedUntil && new Date(bannedUntil).getFullYear() >= 9999
}
