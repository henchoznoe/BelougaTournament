/**
 * File: lib/auth.ts
 * Description: Server-side session management using cookies.
 * Author: Noé Henchoz
 * Date: 2025-12-05
 * License: MIT
 */

import { unstable_cache } from 'next/cache'
import { cookies } from 'next/headers'
import { cache } from 'react'
import { decrypt } from '@/lib/auth-core'
import prisma from '@/lib/db/prisma'
import { Role } from '@/prisma/generated/prisma/enums'

export * from '@/lib/auth-core'

// Constants
const COOKIE_KEYS = {
  SESSION: 'session',
} as const

const CACHE_CONFIG = {
  TAG_USER_ROLE: 'user-role',
  REVALIDATE_SECONDS: 60,
} as const

// Cached user fetcher to prevent database hammering
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

// Get session from cookie
export async function getSession() {
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

// Get admin session from cookie and determine if it is an admin or superadmin
export async function getAdminSession() {
  const session = await getSession()

  if (!session) return null

  const isAuthorized =
    session.user.role === Role.ADMIN || session.user.role === Role.SUPERADMIN

  if (!isAuthorized) return null

  return session
}
