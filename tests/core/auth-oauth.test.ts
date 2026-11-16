/**
 * File: tests/core/auth-oauth.test.ts
 * Description: Exercises Discord callbacks through Better Auth with isolated storage.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { betterAuth } from 'better-auth'
import { memoryAdapter } from 'better-auth/adapters/memory'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Role } from '@/prisma/generated/prisma/enums'

vi.mock('server-only', () => ({}))
vi.mock('@/lib/core/env', () => ({
  env: {
    NODE_ENV: 'test',
    BETTER_AUTH_SECRET:
      'a-discord-flow-test-secret-with-at-least-32-characters',
    BETTER_AUTH_URL: 'https://belouga.test',
    NEXT_PUBLIC_APP_URL: 'https://belouga.test',
    DISCORD_CLIENT_ID: 'test-discord-client',
    DISCORD_CLIENT_SECRET: 'test-discord-secret',
  },
}))
vi.mock('@/lib/core/prisma', () => ({
  default: { user: { findUnique: vi.fn().mockResolvedValue(null) } },
}))

const { default: configuredAuth } = await import('@/lib/core/auth')

const origin = 'https://belouga.test'
const profile = {
  id: '123456789012345678',
  username: 'new-player',
  discriminator: '0',
  global_name: 'New Player',
  email: 'new-player@example.com',
  verified: true,
  avatar: null,
}

const createTestAuth = (storage: Record<string, Record<string, unknown>[]>) =>
  betterAuth({
    ...configuredAuth.options,
    database: memoryAdapter(storage),
  })

describe('Discord OAuth registration', () => {
  let storage: Record<string, Record<string, unknown>[]>
  let auth: ReturnType<typeof createTestAuth>
  let discordProfile: Omit<typeof profile, 'global_name'> & {
    global_name: string | null
  }

  beforeEach(() => {
    storage = { user: [], account: [], session: [], verification: [] }
    discordProfile = { ...profile }
    auth = createTestAuth(storage)
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: string | URL | Request) => {
        const url = input instanceof Request ? input.url : input.toString()
        if (url === 'https://discord.com/api/oauth2/token') {
          return Response.json({
            access_token: 'test-discord-access-token',
            refresh_token: 'test-discord-refresh-token',
            token_type: 'Bearer',
            expires_in: 3600,
            scope: 'identify email',
          })
        }
        if (decodeURIComponent(url) === 'https://discord.com/api/users/@me') {
          return Response.json(discordProfile)
        }
        throw new Error(`Unexpected external request: ${url}`)
      }),
    )
  })

  afterEach(() => vi.unstubAllGlobals())

  const startSignIn = async () => {
    const response = await auth.handler(
      new Request(`${origin}/api/auth/sign-in/social`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', origin },
        body: JSON.stringify({
          provider: 'discord',
          callbackURL: `${origin}/profile`,
          errorCallbackURL: `${origin}/login`,
        }),
      }),
    )
    expect(response.status).toBe(200)
    const { url } = await response.json()
    const state = new URL(url).searchParams.get('state')
    expect(state).toBeTruthy()
    const cookie = response.headers
      .getSetCookie()
      .map(value => value.split(';')[0])
      .join('; ')
    return {
      callback: new Request(
        `${origin}/api/auth/callback/discord?code=test-code&state=${state}`,
        {
          headers: { cookie },
        },
      ),
    }
  }

  it('creates a first-time player and a usable session from the Discord callback', async () => {
    const { callback } = await startSignIn()
    const response = await auth.handler(callback)

    expect(response.headers.get('location')).toBe(`${origin}/profile`)
    expect(storage.user).toHaveLength(1)
    expect(storage.user[0]).toMatchObject({
      name: 'New Player',
      displayName: 'New Player',
      email: profile.email,
      role: Role.USER,
    })
    expect(storage.account).toHaveLength(1)
    expect(storage.session).toHaveLength(1)
    expect(storage.verification).toHaveLength(0)
    const sessionCookie = response.headers
      .getSetCookie()
      .map(value => value.split(';')[0])
      .join('; ')
    const session = await auth.api.getSession({
      headers: new Headers({ cookie: sessionCookie }),
    })
    expect(session?.user).toMatchObject({ displayName: 'New Player' })
    expect(storage.account[0].userId).toBe(storage.user[0].id)
    expect(storage.session[0].userId).toBe(storage.user[0].id)
  })

  it('uses the Discord username when no global name is available', async () => {
    discordProfile.global_name = null
    const { callback } = await startSignIn()
    const response = await auth.handler(callback)

    expect(response.headers.get('location')).toBe(`${origin}/profile`)
    expect(storage.user[0]).toMatchObject({ displayName: 'new-player' })
  })

  it('preserves an existing player nickname on a fresh login', async () => {
    const first = await startSignIn()
    await auth.handler(first.callback)
    expect(storage.user).toHaveLength(1)
    storage.user[0].displayName = 'My chosen nickname'

    const second = await startSignIn()
    const response = await auth.handler(second.callback)

    expect(response.headers.get('location')).toBe(`${origin}/profile`)
    expect(storage.user).toHaveLength(1)
    expect(storage.account).toHaveLength(1)
    expect(storage.user[0].displayName).toBe('My chosen nickname')
  })

  it('rejects a replayed callback without creating another account or session', async () => {
    const { callback } = await startSignIn()
    const replay = callback.clone()
    await auth.handler(callback)
    expect(storage.session).toHaveLength(1)
    const fetchCalls = vi.mocked(fetch).mock.calls.length
    const log = vi.spyOn(console, 'error').mockImplementation(() => {})
    try {
      const response = await auth.handler(replay)

      expect(response.headers.get('location')).toBe(
        `${origin}/login?error=state_mismatch`,
      )
      expect(log).toHaveBeenCalledWith(
        expect.stringContaining('Failed to parse state'),
        expect.objectContaining({
          message: 'State mismatch: verification not found',
        }),
      )
      expect(storage.user).toHaveLength(1)
      expect(storage.session).toHaveLength(1)
      expect(vi.mocked(fetch).mock.calls).toHaveLength(fetchCalls)
    } finally {
      log.mockRestore()
    }
  })

  it('rejects a callback without its signed state cookie before contacting Discord', async () => {
    const { callback } = await startSignIn()
    const log = vi.spyOn(console, 'error').mockImplementation(() => {})
    try {
      const response = await auth.handler(new Request(callback.url))

      expect(response.headers.get('location')).toBe(
        `${origin}/login?error=state_mismatch`,
      )
      expect(storage.user).toHaveLength(0)
      expect(storage.session).toHaveLength(0)
      expect(storage.verification).toHaveLength(1)
      expect(fetch).not.toHaveBeenCalled()
    } finally {
      log.mockRestore()
    }
  })
})
