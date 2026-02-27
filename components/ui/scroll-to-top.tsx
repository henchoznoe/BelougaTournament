/**
 * File: components/ui/scroll-to-top.tsx
 * Description: Client component to force scroll to top on navigation and refresh.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useRef } from 'react'

/**
 * Force the page to scroll to the top whenever the route changes.
 */
export const ScrollToTop = () => {
  const path = usePathname()
  const prevPath = useRef<string>(path)

  useEffect(() => {
    if (path !== prevPath.current) {
      window.scrollTo(0, 0)
      prevPath.current = path
    }
  }, [path])

  return null
}
