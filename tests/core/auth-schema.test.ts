/**
 * File: tests/core/auth-schema.test.ts
 * Description: Checks Better Auth's real Prisma schema contract without a database request.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))
vi.mock('@/lib/core/env', () => ({
  env: {
    NODE_ENV: 'test',
    DATABASE_URL: 'postgresql://test:test@localhost:1/test',
    BETTER_AUTH_SECRET: 'a-schema-contract-test-secret-with-32-characters',
    BETTER_AUTH_URL: 'http://localhost:3000',
    NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
    DISCORD_CLIENT_ID: 'test-discord-client',
    DISCORD_CLIENT_SECRET: 'test-discord-secret',
  },
}))

const { default: auth } = await import('@/lib/core/auth')

describe('Better Auth Prisma schema', () => {
  it('accepts the generated schema before handling an anonymous session', async () => {
    // An empty cookie header returns before querying the database, while the
    // real adapter still validates every model and field required by Better Auth.
    await expect(
      auth.api.getSession({ headers: new Headers() }),
    ).resolves.toBeNull()
  })
})
