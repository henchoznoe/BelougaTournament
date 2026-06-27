/**
 * File: components/public/shared/count-up.tsx
 * Description: Client-only animated number that counts up when scrolled into view.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

'use client'

import { useInView, useReducedMotion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'

interface CountUpProps {
  value: number
  /** Optional suffix appended after the number (e.g. "+"). */
  suffix?: string
  className?: string
}

const COUNT_UP_DURATION_MS = 1200

export const CountUp = ({ value, suffix, className }: CountUpProps) => {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })
  const reduceMotion = useReducedMotion()
  const [display, setDisplay] = useState(reduceMotion ? value : 0)

  useEffect(() => {
    if (!inView || reduceMotion) {
      setDisplay(value)
      return
    }

    const start = performance.now()
    let raf = 0
    const tick = (now: number) => {
      const progress = Math.min((now - start) / COUNT_UP_DURATION_MS, 1)
      const eased = 1 - (1 - progress) ** 3 // easeOutCubic
      setDisplay(Math.round(eased * value))
      if (progress < 1) {
        raf = requestAnimationFrame(tick)
      }
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [inView, reduceMotion, value])

  return (
    <span ref={ref} className={className}>
      {display.toLocaleString('fr-CH')}
      {suffix}
    </span>
  )
}
