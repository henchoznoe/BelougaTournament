/**
 * File: app/api/user/active-ban/route.ts
 * Description: Returns the active ban state for the authenticated public user.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { type NextRequest, NextResponse } from 'next/server'
import auth from '@/lib/core/auth'
import { getActiveUserBan } from '@/lib/services/users'
import type { AuthSession } from '@/lib/types/auth'

export const GET = async (request: NextRequest) => {
  const session = (await auth.api.getSession({
    headers: request.headers,
  })) as AuthSession | null

  if (!session?.user) {
    return NextResponse.json(null, {
      status: 401,
      headers: { 'Cache-Control': 'private, no-store' },
    })
  }

  const ban = await getActiveUserBan(session.user.id)
  return NextResponse.json(
    ban
      ? {
          bannedUntil: ban.bannedUntil?.toISOString() ?? null,
          banReason: ban.banReason,
        }
      : null,
    { headers: { 'Cache-Control': 'private, no-store' } },
  )
}
