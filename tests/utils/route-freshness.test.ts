/**
 * File: tests/utils/route-freshness.test.ts
 * Description: Navigation freshness, restoration, coalescing and profile cleanup behavior.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { describe, expect, it, vi } from 'vitest'
import {
  createRouteFreshnessController,
  needsRouteFreshness,
} from '@/lib/utils/route-freshness'

const setup = () => {
  let frame: (() => void) | undefined
  const refresh = vi.fn()
  const cancel = vi.fn(() => {
    frame = undefined
  })
  const cleanupProfile = vi.fn().mockResolvedValue(false)
  const controller = createRouteFreshnessController({
    refresh,
    cancel,
    cleanupProfile,
    schedule: callback => {
      frame = callback
      return 1
    },
  })
  return {
    controller,
    refresh,
    cleanupProfile,
    cancel,
    flush: () => {
      const run = frame
      frame = undefined
      run?.()
    },
  }
}

describe('navigation freshness', () => {
  it('does not duplicate the initial document request or refresh itself in a loop', async () => {
    const test = setup()
    await test.controller.navigate('/tournaments/cup', '')
    test.flush()
    expect(test.refresh).not.toHaveBeenCalled()
    await test.controller.navigate('/players', '')
    test.flush()
    expect(test.refresh).toHaveBeenCalledTimes(1)
    await test.controller.navigate('/players', '')
    test.flush()
    expect(test.refresh).toHaveBeenCalledTimes(1)
  })

  it('coalesces navigation and history restore into a single RSC refresh', async () => {
    const test = setup()
    await test.controller.navigate('/', '')
    await test.controller.navigate('/admin/tournaments/cup', 'tab=teams')
    test.controller.restore()
    test.controller.restore()
    test.flush()
    expect(test.refresh).toHaveBeenCalledTimes(1)
  })

  it('refreshes restored routes even when the URL has not changed', async () => {
    const test = setup()
    await test.controller.navigate('/tournaments/cup', '')
    test.controller.restore()
    test.flush()
    expect(test.refresh).toHaveBeenCalledTimes(1)
  })

  it('cleans expired profile registrations in an action and refreshes only when needed initially', async () => {
    const test = setup()
    test.cleanupProfile.mockResolvedValue(true)
    await test.controller.navigate('/profile', '')
    test.flush()
    expect(test.cleanupProfile).toHaveBeenCalledTimes(1)
    expect(test.refresh).toHaveBeenCalledTimes(1)
  })

  it('runs profile cleanup again on history restoration without duplicate actions', async () => {
    const test = setup()
    await test.controller.navigate('/profile', '')
    test.controller.restore()
    test.controller.restore()
    await Promise.resolve()
    test.flush()
    expect(test.cleanupProfile).toHaveBeenCalledTimes(2)
    expect(test.refresh).toHaveBeenCalledTimes(1)
  })

  it('ignores a delayed cleanup when the user has left the profile', async () => {
    const test = setup()
    let finish: (changed: boolean) => void = () => {}
    test.cleanupProfile.mockImplementation(
      () =>
        new Promise(resolve => {
          finish = resolve
        }),
    )
    const pending = test.controller.navigate('/profile', '')
    await test.controller.navigate('/legal', '')
    finish(true)
    await pending
    test.flush()
    expect(test.refresh).not.toHaveBeenCalled()
  })

  it('cancels pending work when unmounted', async () => {
    const test = setup()
    await test.controller.navigate('/', '')
    test.controller.restore()
    test.controller.dispose()
    test.flush()
    expect(test.cancel).toHaveBeenCalledWith(1)
    expect(test.refresh).not.toHaveBeenCalled()
  })

  it('limits refreshes to routes containing mutable data', () => {
    expect(needsRouteFreshness('/admin/users')).toBe(true)
    expect(needsRouteFreshness('/players/u-1')).toBe(true)
    expect(needsRouteFreshness('/privacy')).toBe(false)
    expect(needsRouteFreshness('/tournaments-unrelated')).toBe(false)
  })
})
