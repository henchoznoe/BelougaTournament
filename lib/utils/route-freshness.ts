/**
 * File: lib/utils/route-freshness.ts
 * Description: Coalesces navigation freshness checks without polling or refresh loops.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

export const needsRouteFreshness = (pathname: string): boolean =>
  pathname === '/' ||
  /^\/(tournaments|players|profile|admin)(\/|$)/.test(pathname)

export const createRouteFreshnessController = (options: {
  refresh: () => void
  schedule: (callback: () => void) => number
  cancel: (id: number) => void
  cleanupProfile: () => Promise<boolean>
}) => {
  let current: string | null = null
  let pathname = ''
  let frame: number | null = null
  let disposed = false
  let revision = 0
  let profileCleanup: Promise<boolean> | null = null
  const refresh = () => {
    if (disposed || !needsRouteFreshness(pathname) || frame !== null) return
    frame = options.schedule(() => {
      frame = null
      if (!disposed && needsRouteFreshness(pathname)) options.refresh()
    })
  }
  const navigate = async (path: string, search: string, restoring = false) => {
    const key = `${path}?${search}`
    if (current === key && !restoring) return
    const initial = current === null && !restoring
    current = key
    pathname = path
    const version = ++revision
    if (path === '/profile') {
      // Also refresh on failure: a lost session must reach the server guard.
      let changed = true
      try {
        profileCleanup ??= options.cleanupProfile()
        changed = await profileCleanup
      } catch {
        /* Retry on next entry. */
      } finally {
        profileCleanup = null
      }
      if (!disposed && version === revision && (!initial || changed)) refresh()
    } else if (!initial) refresh()
  }
  return {
    navigate,
    restore: () => {
      if (current !== null)
        void navigate(pathname, current.slice(pathname.length + 1), true)
    },
    dispose: () => {
      disposed = true
      revision++
      if (frame !== null) options.cancel(frame)
    },
  }
}
