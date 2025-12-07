/**
 * File: lib/validations/auth.ts
 * Description: Validation schemas for authentication.
 * Author: Noé Henchoz
 * Date: 2025-12-07
 * License: MIT
 */

import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().trim().email('Invalid email address'),
  password: z.string().trim().min(1, 'Password is required'),
})

export type LoginInput = z.infer<typeof loginSchema>
