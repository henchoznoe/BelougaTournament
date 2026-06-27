/**
 * File: components/public/shared/countdown.tsx
 * Description: Client-only live countdown label that refreshes every minute.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

'use client'

import { useEffect, useState } from 'react'
import { formatCountdownShort } from '@/lib/utils/countdown'

interface CountdownProps {
  target: Date | string | number
  /** Text shown before the remaining time (e.g. "Débute dans"). */
  prefix?: string
  className?: string
}

const REFRESH_INTERVAL_MS = 60_000

export const Countdown = ({ target, prefix, className }: CountdownProps) => {
  // Computed on the client only to avoid a server/client hydration mismatch.
  const [label, setLabel] = useState<string | null>(null)

  useEffect(() => {
    const update = () => setLabel(formatCountdownShort(target))
    update()
    const id = setInterval(update, REFRESH_INTERVAL_MS)
    return () => clearInterval(id)
  }, [target])

  if (!label) {
    return null
  }

  return (
    <span className={className}>{prefix ? `${prefix} ${label}` : label}</span>
  )
}
