/**
 * File: components/public/shared/reveal.tsx
 * Description: Scroll-triggered reveal wrapper (fade + rise) honouring reduced motion.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

'use client'

import type { CSSProperties, ReactNode } from 'react'
import { useEffect, useRef, useState } from 'react'

interface RevealProps {
  children: ReactNode
  className?: string
  /** Delay in seconds before the reveal starts — use to stagger sibling items. */
  delay?: number
  /** Vertical offset (px) the element rises from. */
  y?: number
}

/**
 * Animates its content into view once on scroll. When the user prefers reduced
 * motion, the content renders in its final state without any transition.
 */
export const Reveal = ({
  children,
  className,
  delay = 0,
  y = 24,
}: RevealProps) => {
  const ref = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setIsVisible(true)
      return
    }

    const observer = new IntersectionObserver(
      entries => {
        if (entries[0]?.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { rootMargin: '0px 0px -80px' },
    )
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  const style = {
    '--reveal-delay': `${delay}s`,
    '--reveal-y': `${y}px`,
  } as CSSProperties

  return (
    <div
      ref={ref}
      className={className}
      data-reveal-visible={isVisible}
      style={style}
    >
      {children}
    </div>
  )
}
