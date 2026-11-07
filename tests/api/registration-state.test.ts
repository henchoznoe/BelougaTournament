/**
 * File: tests/api/registration-state.test.ts
 * Description: Registration reads distinguish unauthenticated, absent and unavailable states.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { session, readState } = vi.hoisted(() => ({
  session: vi.fn(),
  readState: vi.fn(),
}))
vi.mock('@/lib/core/auth', () => ({
  default: { api: { getSession: session } },
}))
vi.mock('@/lib/services/tournaments-user', () => ({
  getUserTournamentRegistrationState: readState,
}))
const { GET } = await import(
  '@/app/api/tournaments/[id]/registration-state/route'
)
const request = () =>
  new NextRequest('http://localhost/api/tournaments/1/registration-state')
const context = { params: Promise.resolve({ id: 'tournament-1' }) }

beforeEach(() => {
  vi.resetAllMocks()
})
describe('registration state endpoint', () => {
  it('requires a session and never reads another user’s data', async () => {
    session.mockResolvedValue(null)
    expect((await GET(request(), context)).status).toBe(401)
    expect(readState).not.toHaveBeenCalled()
  })
  it('returns an uncached null only when the authenticated read succeeds', async () => {
    session.mockResolvedValue({ user: { id: 'user-1' } })
    readState.mockResolvedValue(null)
    const response = await GET(request(), context)
    expect(response.status).toBe(200)
    expect(await response.json()).toBeNull()
    expect(response.headers.get('Cache-Control')).toBe('private, no-store')
    expect(readState).toHaveBeenCalledWith('user-1', 'tournament-1', {
      throwOnError: true,
    })
  })
  it('reports a failed read as unavailable', async () => {
    session.mockResolvedValue({ user: { id: 'user-1' } })
    readState.mockRejectedValue(new Error('database unavailable'))
    const response = await GET(request(), context)
    expect(response.status).toBe(503)
    expect(await response.json()).toEqual({
      error: 'Impossible de vérifier votre inscription.',
    })
    expect(response.headers.get('Cache-Control')).toBe('private, no-store')
  })
})
