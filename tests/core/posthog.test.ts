/**
 * File: tests/core/posthog.test.ts
 * Description: Unit tests for the server-side PostHog client and exception capture.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'

// ---------------------------------------------------------------------------
// Mocks — must be defined before importing the module under test
// ---------------------------------------------------------------------------

vi.mock('server-only', () => ({}))

const mockEnv: { NEXT_PUBLIC_POSTHOG_KEY?: string; NODE_ENV?: string } = {}
vi.mock('@/lib/core/env', () => ({ env: mockEnv }))

const mockCaptureException = vi.fn()
const mockFlush = vi.fn().mockResolvedValue(undefined)
// Regular function (not arrow) so it can be invoked with `new`.
const PostHogMock = vi.fn(function MockPostHog() {
  return { captureException: mockCaptureException, flush: mockFlush }
})
vi.mock('posthog-node', () => ({ PostHog: PostHogMock }))

beforeEach(() => {
  vi.clearAllMocks()
  // Reset the lazily-instantiated singleton between scenarios.
  vi.resetModules()
  mockEnv.NEXT_PUBLIC_POSTHOG_KEY = undefined
  // Default to a deployed environment; local-dev gating is tested explicitly.
  mockEnv.NODE_ENV = 'production'
})

describe('getPostHogServer', () => {
  it('returns null and never constructs a client when no key is configured', async () => {
    const { getPostHogServer } = await import('@/lib/core/posthog')

    expect(getPostHogServer()).toBeNull()
    expect(PostHogMock).not.toHaveBeenCalled()
  })

  it('returns a single shared client when a key is configured', async () => {
    mockEnv.NEXT_PUBLIC_POSTHOG_KEY = 'phc_test'
    const { getPostHogServer } = await import('@/lib/core/posthog')

    const first = getPostHogServer()
    const second = getPostHogServer()

    expect(first).not.toBeNull()
    expect(first).toBe(second)
    expect(PostHogMock).toHaveBeenCalledTimes(1)
  })

  it('returns null outside production even when a key is configured', async () => {
    mockEnv.NEXT_PUBLIC_POSTHOG_KEY = 'phc_test'
    mockEnv.NODE_ENV = 'development'
    const { getPostHogServer } = await import('@/lib/core/posthog')

    expect(getPostHogServer()).toBeNull()
    expect(PostHogMock).not.toHaveBeenCalled()
  })
})

describe('captureServerException', () => {
  it('no-ops when no key is configured', async () => {
    const { captureServerException } = await import('@/lib/core/posthog')

    await captureServerException(new Error('boom'))

    expect(mockCaptureException).not.toHaveBeenCalled()
    expect(mockFlush).not.toHaveBeenCalled()
  })

  it('captures the exception and flushes when configured', async () => {
    mockEnv.NEXT_PUBLIC_POSTHOG_KEY = 'phc_test'
    const { captureServerException } = await import('@/lib/core/posthog')

    const error = new Error('boom')
    await captureServerException(error, 'user-1', { source: 'test' })

    expect(mockCaptureException).toHaveBeenCalledWith(error, 'user-1', {
      source: 'test',
    })
    expect(mockFlush).toHaveBeenCalledOnce()
  })

  it('wraps non-Error values in an Error before capturing', async () => {
    mockEnv.NEXT_PUBLIC_POSTHOG_KEY = 'phc_test'
    const { captureServerException } = await import('@/lib/core/posthog')

    await captureServerException('string failure')

    const [firstArg] = mockCaptureException.mock.calls[0]
    expect(firstArg).toBeInstanceOf(Error)
    expect((firstArg as Error).message).toBe('string failure')
  })
})
