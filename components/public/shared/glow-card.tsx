/**
 * File: components/public/shared/glow-card.tsx
 * Description: Glass card with a hover brand glow and an optional decorative blob.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import type { ReactNode } from 'react'
import { cn } from '@/lib/utils/cn'

interface GlowCardProps {
  children: ReactNode
  className?: string
  /** Render a soft blurred brand blob in the top-right corner. */
  blob?: boolean
}

export const GlowCard = ({
  children,
  className,
  blob = true,
}: GlowCardProps) => (
  <div
    className={cn(
      'glass glow-brand-hover group relative overflow-hidden rounded-2xl transition-colors duration-300 hover:border-brand/20',
      className,
    )}
  >
    {blob && (
      <div className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full bg-brand/5 blur-3xl transition-all duration-500 group-hover:scale-125 group-hover:bg-brand/10" />
    )}
    <div className="relative z-10 h-full">{children}</div>
  </div>
)
