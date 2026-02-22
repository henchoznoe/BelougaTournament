/**
 * File: proxy.ts
 * Description: Next.js proxy to protect admin routes at the edge.
 *   Verifies session and user role before any component or page is rendered.
 *   Redirects unauthenticated or unauthorized users immediately.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { type NextRequest, NextResponse } from 'next/server'
import type { AuthSession } from '@/lib/types/auth'
import { Role } from '@/prisma/generated/prisma/enums'

const ADMIN_ROLES = new Set<Role>([Role.ADMIN, Role.SUPERADMIN])

/** Fetch the active session from the BetterAuth session endpoint. */
const fetchSession = async (request: NextRequest): Promise<AuthSession | null> => {
  try {
    const response = await fetch(new URL('/api/auth/get-session', request.url), {
      headers: { cookie: request.headers.get('cookie') ?? '' },
    })
    if (!response.ok) return null
    return (await response.json()) as AuthSession
  } catch {
    return null
  }
}

export const proxy = async (request: NextRequest) => {
  const session = await fetchSession(request)

  if (!session?.user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (!ADMIN_ROLES.has(session.user.role)) {
    return NextResponse.redirect(new URL('/unauthorized', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*'],
}
