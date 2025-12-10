/**
 * File: components/shared/ui/scroll-to-top.tsx
 * Description: Client component to force scroll to top on navigation and refresh.
 * Author: Noé Henchoz
 * Date: 2025-12-07
 * License: MIT
 */

"use client"

// ----------------------------------------------------------------------
// IMPORTS
// ----------------------------------------------------------------------

import { usePathname } from "next/navigation"
import { useEffect } from "react"

// ----------------------------------------------------------------------
// COMPONENT
// ----------------------------------------------------------------------

export const ScrollToTop = () => {
  const pathname = usePathname()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return null
}
