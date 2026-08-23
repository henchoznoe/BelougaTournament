/**
 * File: app/api/tournaments/[id]/registration-state/route.ts
 * Description: Returns a signed-in user's registration state for one tournament.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { type NextRequest, NextResponse } from 'next/server'
import auth from '@/lib/core/auth'
import { getUserTournamentRegistrationState } from '@/lib/services/tournaments-user'
import type { AuthSession } from '@/lib/types/auth'

interface RouteContext {
  params: Promise<{ id: string }>
}

export const GET = async (request: NextRequest, context: RouteContext) => {
  const session = (await auth.api.getSession({
    headers: request.headers,
  })) as AuthSession | null

  if (!session?.user) {
    return NextResponse.json(null, {
      status: 401,
      headers: { 'Cache-Control': 'private, no-store' },
    })
  }

  const { id } = await context.params
  const state = await getUserTournamentRegistrationState(session.user.id, id)
  return NextResponse.json(state, {
    headers: { 'Cache-Control': 'private, no-store' },
  })
}
