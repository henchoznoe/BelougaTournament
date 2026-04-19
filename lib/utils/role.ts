/**
 * File: lib/utils/role.ts
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
