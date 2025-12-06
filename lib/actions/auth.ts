/**
 * File: lib/actions/auth.ts
 * Description: Server actions for user authentication (login, logout).
 * Author: Noé Henchoz
 * Date: 2025-12-06
 * License: MIT
 */

'use server'

import { compare } from 'bcryptjs'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import z from 'zod'
import { encrypt, type SessionPayload } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { Role } from '@/prisma/generated/prisma/enums'

// Types
type LoginState = {
  message?: string
  email?: string
  errors?: Record<string, string[]>
}

// Constants
const COOKIE_CONFIG = {
  NAME: 'session',
  DURATION_MS: 24 * 60 * 60 * 1000, // 24 hours
} as const

const ROUTES = {
  HOME: '/',
  ADMIN_DASHBOARD: '/admin',
} as const

// Schemas
const authSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, 'Password is required'),
})

const MESSAGES = {
  ERR_MISSING_CREDS: 'Email and password are required.',
  ERR_INVALID_CREDS: 'Invalid credentials.',
  ERR_UNAUTHORIZED: 'Access denied. Insufficient permissions.',
  ERR_SUPERADMIN_ONLY:
    'Unauthorized: Only SuperAdmins can perform this action.',
  ERR_VALIDATION: 'Invalid input data.',
  SUCCESS_REGISTER: 'Admin registered successfully.',
} as const

const createSessionCookie = async (payload: SessionPayload) => {
  const expires = new Date(Date.now() + COOKIE_CONFIG.DURATION_MS)
  const sessionToken = await encrypt({ ...payload, expires })
  const cookieStore = await cookies()

  cookieStore.set(COOKIE_CONFIG.NAME, sessionToken, {
    expires,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
  })
}

export const login = async (
  _prevState: unknown,
  formData: FormData,
): Promise<LoginState> => {
  const rawData = {
    email: formData.get('email'),
    password: formData.get('password'),
  }

  // 1. Validate Input
  const validation = authSchema.safeParse(rawData)

  if (!validation.success) {
    return {
      message: MESSAGES.ERR_MISSING_CREDS,
      email: rawData.email as string,
    }
  }

  const { email, password } = validation.data

  // 2. Verify User
  const user = await prisma.user.findUnique({
    where: { email },
  })

  // We use a generic error message to avoid enumerating users
  if (!user || !(await compare(password, user.passwordHash))) {
    return { message: MESSAGES.ERR_INVALID_CREDS, email }
  }

  // 3. Verify Role Authorization
  const isAuthorized = user.role === Role.ADMIN || user.role === Role.SUPERADMIN

  if (!isAuthorized) {
    return { message: MESSAGES.ERR_UNAUTHORIZED, email }
  }

  // 4. Create Session
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
