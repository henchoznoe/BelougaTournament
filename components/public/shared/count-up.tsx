/**
 * File: components/public/shared/count-up.tsx
 * Description: Client-only animated number that counts up when scrolled into view.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

'use client'

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
  const [inView, setInView] = useState(false)
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const observer = new IntersectionObserver(
      entries => {
        if (entries[0]?.isIntersecting) {
          setInView(true)
          observer.disconnect()
        }
      },
      { rootMargin: '0px 0px -60px' },
    )
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!inView) return

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
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
  }, [inView, value])

  return (
    <span ref={ref} className={className}>
      {display.toLocaleString('fr-CH')}
      {suffix}
    </span>
  )
}
