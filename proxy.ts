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
import { ADMIN_ROUTE_ROLES } from '@/lib/config/routes'
import type { AuthSession } from '@/lib/types/auth'
import { Role } from '@/prisma/generated/prisma/enums'

const ADMIN_ROLES = new Set<Role>([Role.ADMIN, Role.SUPERADMIN])

/**
 * Sorted route prefixes (longest first) so that the most specific prefix
 * matches before a shorter one (e.g. /admin/tournaments before /admin).
 */
const SORTED_ROUTE_ENTRIES = Object.entries(ADMIN_ROUTE_ROLES).sort(
  (a, b) => b[0].length - a[0].length,
)

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

/** Resolve the minimum role required for the given pathname. */
const getRequiredRole = (pathname: string): Role => {
  const match = SORTED_ROUTE_ENTRIES.find(([prefix]) => pathname.startsWith(prefix))
  return match ? match[1] : Role.ADMIN
}

export const proxy = async (request: NextRequest) => {
  const session = await fetchSession(request)

  if (!session?.user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (!ADMIN_ROLES.has(session.user.role)) {
    return NextResponse.redirect(new URL('/unauthorized', request.url))
  }

  const requiredRole = getRequiredRole(request.nextUrl.pathname)
  if (requiredRole === Role.SUPERADMIN && session.user.role !== Role.SUPERADMIN) {
    return NextResponse.redirect(new URL('/unauthorized', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*'],
}
