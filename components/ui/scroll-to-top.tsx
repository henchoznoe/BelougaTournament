/**
 * File: components/shared/ui/scroll-to-top.tsx
 * Description: Client component to force scroll to top on navigation and refresh.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useRef } from 'react'

/** Forces the page to scroll to the top whenever the route changes. */
export const ScrollToTop = () => {
  const pathname = usePathname()
  const previousPathname = useRef(pathname)

  useEffect(() => {
    if (pathname !== previousPathname.current) {
      window.scrollTo(0, 0)
      previousPathname.current = pathname
    }
  }, [pathname])

  return null
}
