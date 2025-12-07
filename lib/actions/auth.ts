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
import { encrypt, type SessionPayload } from '@/lib/auth'
import { AUTH_CONFIG } from '@/lib/config/auth'
import { ACTION_MESSAGES } from '@/lib/config/messages'
import { APP_ROUTES } from '@/lib/config/routes'
import prisma from '@/lib/db/prisma'
import { env } from '@/lib/env'
import type { ActionState } from '@/lib/types/actions'
import { loginSchema } from '@/lib/validations/auth'
import { Role } from '@/prisma/generated/prisma/enums'

// Helper Functions
const createSessionCookie = async (payload: SessionPayload) => {
  const expires = new Date(Date.now() + AUTH_CONFIG.SESSION_DURATION_MS)
  const sessionToken = await encrypt({ ...payload, expires })
  const cookieStore = await cookies()

  cookieStore.set(AUTH_CONFIG.COOKIE_NAME, sessionToken, {
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
  // Safe Data Extraction
  const rawData = Object.fromEntries(formData)

  // Validate Input
  const validation = loginSchema.safeParse(rawData)

  if (!validation.success) {
    return {
      success: false,
      message: ACTION_MESSAGES.AUTH.ERR_MISSING_CREDS,
      inputs: typeof rawData.email === 'string' ? rawData.email : '',
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
      message: ACTION_MESSAGES.AUTH.ERR_INVALID_CREDS,
      inputs: email,
    }
  }

  // Verify Role Authorization
  const isAuthorized = user.role === Role.ADMIN || user.role === Role.SUPERADMIN

  if (!isAuthorized) {
    return {
      success: false,
      message: ACTION_MESSAGES.AUTH.ERR_UNAUTHORIZED,
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

  redirect(APP_ROUTES.ADMIN_DASHBOARD)
}

export const logout = async () => {
  const cookieStore = await cookies()
  cookieStore.delete(AUTH_CONFIG.COOKIE_NAME)
  redirect(APP_ROUTES.HOME)
}
