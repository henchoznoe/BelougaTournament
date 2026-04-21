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
import { isRoleValue } from '@/lib/utils/role'
import { Role } from '@/prisma/generated/prisma/enums'

/**
 * Sorted route prefixes (longest first) so that the most specific prefix
 * matches before a shorter one (e.g. /admin/tournaments before /admin).
 */
const SORTED_ROUTE_ENTRIES = Object.entries(ADMIN_ROUTE_ROLES).sort(
  (a, b) => b[0].length - a[0].length,
)

/**
 * Pinned base URL for the BetterAuth session endpoint.
 *
 * Middleware runs on the Edge runtime so we can't import the Prisma-backed
 * `auth.api.getSession` here. Instead we call the app's own session endpoint,
 * but we MUST pin the base URL to a trusted value — deriving the host from
 * `request.url` lets an attacker spoof the `Host` header and redirect the
 * session fetch to an attacker-controlled origin that forges a session JSON
 * and returns it to us. We pin to `BETTER_AUTH_URL` (the canonical BetterAuth
 * base), falling back to `NEXT_PUBLIC_APP_URL`.
 *
 * Note: `process.env` is accessed directly here because `lib/core/env.ts` relies
 * on the Prisma-backed Node.js runtime and cannot be imported on the Edge.
 * This is the only justified exception to the "never access process.env directly" rule.
 */
const TRUSTED_BASE_URL =
  process.env.BETTER_AUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL

/** Fetch the active session from the trusted BetterAuth session endpoint. */
const fetchSession = async (
  request: NextRequest,
): Promise<AuthSession | null> => {
  if (!TRUSTED_BASE_URL) return null
  try {
    const response = await fetch(
      new URL('/api/auth/get-session', TRUSTED_BASE_URL),
      { headers: { cookie: request.headers.get('cookie') ?? '' } },
    )
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

/**
 * Roles that satisfy a given minimum role requirement.
 * Any role listed here (or higher) is considered authorized.
 * Currently only ADMIN exists; extend this map when new privileged roles are added.
 */
const ROLE_ALLOWLIST: Record<Role, Set<Role>> = {
  [Role.ADMIN]: new Set([Role.ADMIN]),
  [Role.USER]: new Set([Role.USER]),
} as const

export const proxy = async (request: NextRequest) => {
  const session = await fetchSession(request)

  if (!session?.user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  const requiredRole = getRequiredRole(request.nextUrl.pathname)
  const allowedRoles = ROLE_ALLOWLIST[requiredRole] ?? new Set([requiredRole])
  // Guard against a malformed/tampered session JSON returning an unknown role string.
  if (!isRoleValue(session.user.role) || !allowedRoles.has(session.user.role)) {
    return NextResponse.redirect(new URL('/unauthorized', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*'],
}
