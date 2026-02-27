/**
 * File: components/ui/current-year.tsx
 * Description: Client component that renders the current year.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

'use client'

export const CurrentYear = () => {
  return <>{new Date().getFullYear()}</>
}
