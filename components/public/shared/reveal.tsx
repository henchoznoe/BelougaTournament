/**
 * File: components/public/shared/reveal.tsx
 * Description: Scroll-triggered reveal wrapper (fade + rise) honouring reduced motion.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

'use client'

import { motion, useReducedMotion } from 'framer-motion'
import type { ReactNode } from 'react'

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
  const reduceMotion = useReducedMotion()

  return (
    <motion.div
      className={className}
      initial={reduceMotion ? false : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.5, ease: 'easeOut', delay }}
    >
      {children}
    </motion.div>
  )
}
