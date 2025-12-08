/**
 * File: lib/validations/admin.ts
 * Description: Validation schemas for admin creation and updates.
 * Author: Noé Henchoz
 * Date: 2025-12-07
 * License: MIT
 */

// ----------------------------------------------------------------------
// IMPORTS
// ----------------------------------------------------------------------

import { z } from 'zod'
import { Role } from '@/prisma/generated/prisma/enums'

// ----------------------------------------------------------------------
// CONSTANTS
// ----------------------------------------------------------------------

export const createAdminSchema = z.object({
  email: z.string().email('Invalid email address'),
})

export const updateAdminSchema = z.object({
  email: z.string().email(),
  role: z.nativeEnum(Role),
})

export type CreateAdminInput = z.infer<typeof createAdminSchema>
export type UpdateAdminInput = z.infer<typeof updateAdminSchema>
