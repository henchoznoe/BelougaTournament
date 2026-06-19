/**
 * File: lib/utils/role.ts
 * Description: Pure helper functions for authentication role checks.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { Role } from '@/prisma/generated/prisma/enums'

/** Type guard: narrows an arbitrary string to a valid Role enum value. */
export const isRoleValue = (value: string): value is Role =>
  Object.values(Role).includes(value as Role)

/** Returns true if the given role is exactly SUPER_ADMIN. */
export const isSuperAdmin = (role: Role): boolean => role === Role.SUPER_ADMIN

/** Returns true if the given role has admin-level access (ADMIN or SUPER_ADMIN). */
export const hasAdminAccess = (role: Role): boolean =>
  role === Role.ADMIN || role === Role.SUPER_ADMIN

/** Returns true if the given role has admin privileges. */
export const isAdmin = (role: Role): boolean => hasAdminAccess(role)

/** Hierarchy ranks: a higher-ranked role satisfies any lower-or-equal requirement. */
const ROLE_RANK: Record<Role, number> = {
  [Role.USER]: 0,
  [Role.ADMIN]: 1,
  [Role.SUPER_ADMIN]: 2,
}

/**
 * Single source of truth for the role hierarchy. Returns true if `userRole`
 * meets or exceeds `requiredRole`. Consumed by both the server-action wrapper
 * and the edge proxy so authorization rules can never diverge between layers.
 */
export const satisfiesRole = (userRole: Role, requiredRole: Role): boolean =>
  ROLE_RANK[userRole] >= ROLE_RANK[requiredRole]
