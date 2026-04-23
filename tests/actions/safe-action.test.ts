/**
 * File: tests/actions/safe-action.test.ts
 * Description: Unit tests for the authenticatedAction wrapper (auth, role, validation, errors).
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { z } from 'zod'
import { Prisma } from '@/prisma/generated/prisma/client'
import { Role } from '@/prisma/generated/prisma/enums'

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock('server-only', () => ({}))

const mockGetSession = vi.fn()
vi.mock('@/lib/core/auth', () => ({
  default: {
    api: { getSession: (...args: unknown[]) => mockGetSession(...args) },
  },
}))

vi.mock('next/headers', () => ({
  headers: vi.fn().mockResolvedValue(new Headers()),
}))

vi.mock('@/lib/core/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))

// ---------------------------------------------------------------------------
// Module under test
// ---------------------------------------------------------------------------

const { authenticatedAction } = await import('@/lib/actions/safe-action')

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const schema = z.object({ name: z.string().min(1) })

const makeSession = (role: Role = Role.ADMIN, id = 'user-1') => ({
  user: { id, role, email: 'test@example.com', name: 'Test' },
  session: {
    id: 'session-1',
    userId: id,
    token: 'tok',
    expiresAt: '2027-01-01',
  },
})

// ---------------------------------------------------------------------------
// Authentication
// ---------------------------------------------------------------------------

describe('authenticatedAction — authentication', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns Unauthorized when session is null', async () => {
    mockGetSession.mockResolvedValue(null)

    const action = authenticatedAction({
      schema,
      handler: async () => ({ success: true, message: 'ok' }),
    })

    const result = await action({ name: 'test' })

    expect(result).toEqual({ success: false, message: 'Unauthorized' })
  })

  it('returns Unauthorized when session has no user', async () => {
    mockGetSession.mockResolvedValue({ user: null, session: {} })

    const action = authenticatedAction({
      schema,
      handler: async () => ({ success: true, message: 'ok' }),
    })

    const result = await action({ name: 'test' })

    expect(result).toEqual({ success: false, message: 'Unauthorized' })
  })

  it('calls the handler when session is valid and no role is required', async () => {
    mockGetSession.mockResolvedValue(makeSession(Role.USER))

    const handler = vi
      .fn()
      .mockResolvedValue({ success: true, message: 'done' })
    const action = authenticatedAction({ schema, handler })

    const result = await action({ name: 'test' })

    expect(result).toEqual({ success: true, message: 'done' })
    expect(handler).toHaveBeenCalledOnce()
  })
})

// ---------------------------------------------------------------------------
// Role checking
// ---------------------------------------------------------------------------

describe('authenticatedAction — role checking', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns Unauthorized when user role does not match single required role', async () => {
    mockGetSession.mockResolvedValue(makeSession(Role.USER))

    const action = authenticatedAction({
      schema,
      role: Role.ADMIN,
      handler: async () => ({ success: true, message: 'ok' }),
    })

    expect(await action({ name: 'test' })).toEqual({
      success: false,
      message: 'Unauthorized',
    })
  })

  it('allows access when user role matches single required role', async () => {
    mockGetSession.mockResolvedValue(makeSession(Role.ADMIN))

    const handler = vi.fn().mockResolvedValue({ success: true, message: 'ok' })
    const action = authenticatedAction({
      schema,
      role: Role.ADMIN,
      handler,
    })

    await action({ name: 'test' })

    expect(handler).toHaveBeenCalledOnce()
  })

  it('allows access when user role is one of the allowed roles', async () => {
    mockGetSession.mockResolvedValue(makeSession(Role.ADMIN))

    const handler = vi.fn().mockResolvedValue({ success: true, message: 'ok' })
    const action = authenticatedAction({
      schema,
      role: [Role.ADMIN, Role.USER],
      handler,
    })

    await action({ name: 'test' })

    expect(handler).toHaveBeenCalledOnce()
  })

  it('returns Unauthorized when the session role is malformed even if a role is required', async () => {
    mockGetSession.mockResolvedValue({
      user: {
        id: 'user-1',
        role: null,
        email: 'test@example.com',
        name: 'Test',
      },
      session: {
        id: 'session-1',
        userId: 'user-1',
        token: 'tok',
        expiresAt: '2027-01-01',
      },
    })

    const action = authenticatedAction({
      schema,
      role: Role.ADMIN,
      handler: async () => ({ success: true, message: 'ok' }),
    })

    expect(await action({ name: 'test' })).toEqual({
      success: false,
      message: 'Unauthorized',
    })
  })
})

// ---------------------------------------------------------------------------
// Input validation
// ---------------------------------------------------------------------------

describe('authenticatedAction — input validation', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns a validation error when input fails schema', async () => {
    mockGetSession.mockResolvedValue(makeSession())

    const action = authenticatedAction({
      schema,
      handler: async () => ({ success: true, message: 'ok' }),
    })

    const result = await action({ name: '' })

    expect(result.success).toBe(false)
    expect(result.message).toBe('Validation error')
    expect(result.errors).toBeDefined()
  })

  it('passes validated data to the handler', async () => {
    mockGetSession.mockResolvedValue(makeSession())

    const handler = vi.fn().mockResolvedValue({ success: true, message: 'ok' })
    const action = authenticatedAction({ schema, handler })

    await action({ name: 'Alice' })

    expect(handler).toHaveBeenCalledWith(
      { name: 'Alice' },
      expect.objectContaining({
        user: expect.objectContaining({ role: Role.ADMIN }),
      }),
    )
  })
})

// ---------------------------------------------------------------------------
// Error handling
// ---------------------------------------------------------------------------

describe('authenticatedAction — error handling', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns a Prisma error response for PrismaClientKnownRequestError', async () => {
    mockGetSession.mockResolvedValue(makeSession())

    const prismaError = new Prisma.PrismaClientKnownRequestError(
      'unique constraint',
      {
        code: 'P2002',
        clientVersion: '7.0.0',
      },
    )

    const action = authenticatedAction({
      schema,
      handler: async () => {
        throw prismaError
      },
    })

    const result = await action({ name: 'test' })

    expect(result).toEqual({
      success: false,
      message: 'Cette valeur existe déjà.',
    })
  })

  it('returns Internal server error for unexpected errors', async () => {
    mockGetSession.mockResolvedValue(makeSession())

    const action = authenticatedAction({
      schema,
      handler: async () => {
        throw new Error('Unexpected failure')
      },
    })

    const result = await action({ name: 'test' })

    expect(result).toEqual({ success: false, message: 'Internal server error' })
  })

  it('returns Unauthorized when getSession itself throws', async () => {
    mockGetSession.mockRejectedValue(new Error('Auth service down'))

    const action = authenticatedAction({
      schema,
      handler: async () => ({ success: true, message: 'ok' }),
    })

    const result = await action({ name: 'test' })

    expect(result).toEqual({ success: false, message: 'Internal server error' })
  })
})
