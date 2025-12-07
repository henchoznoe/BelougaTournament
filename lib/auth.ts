/**
 * File: lib/auth.ts
 * Description: Server-side session management using cookies.
 * Author: Noé Henchoz
 * Date: 2025-12-05
 * License: MIT
 */

// ----------------------------------------------------------------------
// IMPORTS
// ----------------------------------------------------------------------

import { unstable_cache } from 'next/cache'
import { cookies } from 'next/headers'
import { cache } from 'react'
import { decrypt } from '@/lib/auth-core'
import { ACTION_MESSAGES } from '@/lib/config/messages'
import prisma from '@/lib/db/prisma'
import type { ActionState } from '@/lib/types/actions'
import { Role } from '@/prisma/generated/prisma/enums'

export * from '@/lib/auth-core'

// ----------------------------------------------------------------------
// CONSTANTS
// ----------------------------------------------------------------------

const COOKIE_KEYS = {
  SESSION: 'session',
} as const

const CACHE_CONFIG = {
  TAG_USER_ROLE: 'user-role',
  REVALIDATE_SECONDS: 60,
} as const

// ----------------------------------------------------------------------
// LOGIC
// ----------------------------------------------------------------------

const getCachedUser = cache(async (userId: string) => {
  const fetchUser = async () => {
    return prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, role: true },
    })
  }

  return unstable_cache(
    fetchUser,
    [`${CACHE_CONFIG.TAG_USER_ROLE}-${userId}`],
    {
      tags: [CACHE_CONFIG.TAG_USER_ROLE, userId],
      revalidate: CACHE_CONFIG.REVALIDATE_SECONDS,
    },
  )()
})

export const getSession = async () => {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get(COOKIE_KEYS.SESSION)?.value

  if (!sessionCookie) return null

  try {
    const payload = await decrypt(sessionCookie)
    const user = await getCachedUser(payload.user.id)

    if (!user) return null

    return {
      ...payload,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    }
  } catch (error) {
    // Session is invalid or expired
    console.error(error)
    return null
  }
}

export const getAdminSession = async () => {
  const session = await getSession()

  if (!session) return null

  const isAuthorized =
    session.user.role === Role.ADMIN || session.user.role === Role.SUPERADMIN

  if (!isAuthorized) return null

  return session
}

/**
 * Validates that the current request is from an authenticated Admin or SuperAdmin.
 * Returns an error ActionState if invalid, or null if valid.
 */
export const validateRequestIsAdmin = async (): Promise<ActionState | null> => {
  const session = await getSession()

  if (
    !session ||
    !session.user ||
    (session.user.role !== Role.ADMIN && session.user.role !== Role.SUPERADMIN)
  ) {
    return {
      success: false,
      message: ACTION_MESSAGES.TOURNAMENTS.UNAUTHORIZED, // Or a generic UNAUTHORIZED message
    }
  }

  return null
}
