/**
 * File: lib/validations/auth.ts
 * Description: Validation schemas for authentication
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { z } from 'zod'

export const loginSchema = z.object({
  email: z.email('Email invalide'),
  password: z.string().min(1, 'Mot de passe requis'),
})

export type LoginInput = z.infer<typeof loginSchema>
