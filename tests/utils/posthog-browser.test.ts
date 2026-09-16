/**
 * File: tests/utils/posthog-browser.test.ts
 * Description: Unit tests for the browser-side PostHog facade.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { afterEach, describe, expect, it, vi } from 'vitest'
import { posthogBrowser } from '@/lib/utils/posthog-browser'

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('posthogBrowser', () => {
  it('does nothing when called outside the browser', () => {
    expect(() => posthogBrowser.capture('login_initiated')).not.toThrow()
  })

  it('queues events before the PostHog CDN client is loaded', () => {
    const queue: unknown[][] = []
    vi.stubGlobal('window', { posthog: queue })

    posthogBrowser.capture('login_initiated', { provider: 'discord' })

    expect(queue).toEqual([
      ['capture', 'login_initiated', { provider: 'discord' }],
    ])
  })

  it('preserves the PostHog instance as the method receiver', () => {
    const capture = vi.fn(function (this: unknown) {
      expect(this).toBe(queue)
    })
    const queue = Object.assign([] as unknown[][], { capture })
    vi.stubGlobal('window', { posthog: queue })

    posthogBrowser.capture('login_initiated')

    expect(capture).toHaveBeenCalledWith('login_initiated')
  })

  it('swallows third-party analytics errors', () => {
    const queue = Object.assign([] as unknown[][], {
      capture: vi.fn(() => {
        throw new Error('PostHog CDN failure')
      }),
    })
    vi.stubGlobal('window', { posthog: queue })

    expect(() => posthogBrowser.capture('login_initiated')).not.toThrow()
  })
})
