/**
 * File: components/shared/ui/scroll-to-top.tsx
 * Description: Client component to force scroll to top on navigation and refresh.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

"use client"

import { usePathname } from "next/navigation"
import { useEffect } from "react"

export const ScrollToTop = () => {
  const pathname = usePathname()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return null
}
