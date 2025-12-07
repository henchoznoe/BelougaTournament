/**
 * File: lib/validations/auth.ts
 * Description: Validation schemas for authentication.
 * Author: Noé Henchoz
 * Date: 2025-12-07
 * License: MIT
 */

// ----------------------------------------------------------------------
// IMPORTS
// ----------------------------------------------------------------------

import { z } from 'zod'

// ----------------------------------------------------------------------
// CONSTANTS
// ----------------------------------------------------------------------

export const loginSchema = z.object({
  email: z.string().trim().email('Invalid email address'),
  password: z.string().trim().min(1, 'Password is required'),
})

export type LoginInput = z.infer<typeof loginSchema>
