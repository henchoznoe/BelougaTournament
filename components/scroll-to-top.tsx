/**
 * File: components/scroll-to-top.tsx
 * Description: Client component to force scroll to top on navigation and refresh.
 * Author: Noé Henchoz
 * Date: 2025-12-04
 * License: MIT
 */

"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export const ScrollToTop = () => {
  const pathname = usePathname();

  useEffect(() => {
    // Force scroll to top on mount (refresh) and navigation
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
