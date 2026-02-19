/**
 * File: lib/validations/admin.ts
 * Description: Validation schemas for admin management
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { z } from 'zod'
import { Role } from '@/prisma/generated/prisma/enums'

export const createAdminSchema = z.object({
  email: z.email('Email invalide'),
})

export const updateAdminSchema = z.object({
  email: z.email('Email invalide'),
  role: z.enum(Role),
})

export type CreateAdminInput = z.infer<typeof createAdminSchema>
export type UpdateAdminInput = z.infer<typeof updateAdminSchema>
