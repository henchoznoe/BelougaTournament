/**
 * File: lib/actions/auth.ts
 * Description: Server actions for user authentication (login, logout).
 * Author: Noé Henchoz
 * Date: 2025-12-07
 * License: MIT
 */

'use server'

import { compare } from 'bcryptjs'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import z from 'zod'
import { encrypt, type SessionPayload } from '@/lib/auth'
import prisma from '@/lib/db/prisma'
import { env } from '@/lib/env'
import type { ActionState } from '@/lib/types/actions'
import { Role } from '@/prisma/generated/prisma/enums'

// Constants
const COOKIE_CONFIG = {
  NAME: 'session',
  DURATION_MS: 24 * 60 * 60 * 1000, // 24 hours
} as const

const ROUTES = {
  HOME: '/',
  ADMIN_DASHBOARD: '/admin',
} as const

const MESSAGES = {
  ERR_MISSING_CREDS: 'Email and password are required.',
  ERR_INVALID_CREDS: 'Invalid credentials.',
  ERR_UNAUTHORIZED: 'Access denied. Insufficient permissions.',
  ERR_SUPERADMIN_ONLY:
    'Unauthorized: Only SuperAdmins can perform this action.',
  ERR_VALIDATION: 'Invalid input data.',
  SUCCESS_REGISTER: 'Admin registered successfully.',
} as const

// Schemas
const authSchema = z.object({
  email: z.string().trim().email('Invalid email address'),
  password: z.string().trim().min(1, 'Password is required'),
})

// Helper Functions
const createSessionCookie = async (payload: SessionPayload) => {
  const expires = new Date(Date.now() + COOKIE_CONFIG.DURATION_MS)
  const sessionToken = await encrypt({ ...payload, expires })
  const cookieStore = await cookies()

  cookieStore.set(COOKIE_CONFIG.NAME, sessionToken, {
    expires,
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
  })
}

// Server Actions
export const login = async (
  _prevState: ActionState<string> | undefined,
  formData: FormData,
): Promise<ActionState<string>> => {
  // Safe Data Extraction (No casting)
  const rawData = {
    email: formData.get('email')?.toString() || '',
    password: formData.get('password')?.toString() || '',
  }

  // Validate Input
  const validation = authSchema.safeParse(rawData)

  if (!validation.success) {
    return {
      success: false,
      message: MESSAGES.ERR_MISSING_CREDS,
      inputs: rawData.email,
      errors: validation.error.flatten().fieldErrors,
    }
  }

  const { email, password } = validation.data

  // Verify User
  const user = await prisma.user.findUnique({
    where: { email },
  })

  // We use a generic error message to avoid enumerating users
  if (!user || !(await compare(password, user.passwordHash))) {
    return {
      success: false,
      message: MESSAGES.ERR_INVALID_CREDS,
      inputs: email,
    }
  }

  // Verify Role Authorization
  const isAuthorized = user.role === Role.ADMIN || user.role === Role.SUPERADMIN

  if (!isAuthorized) {
    return {
      success: false,
      message: MESSAGES.ERR_UNAUTHORIZED,
      inputs: email,
    }
  }

  // Create Session
  await createSessionCookie({
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
    },
  })

  redirect(ROUTES.ADMIN_DASHBOARD)
}

export const logout = async () => {
  const cookieStore = await cookies()
  cookieStore.delete(COOKIE_CONFIG.NAME)
  redirect(ROUTES.HOME)
}
