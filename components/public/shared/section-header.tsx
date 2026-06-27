/**
 * File: components/public/shared/section-header.tsx
 * Description: Reusable section/page header with an optional eyebrow, title and description.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import type { ReactNode } from 'react'
import { cn } from '@/lib/utils/cn'

interface SectionHeaderProps {
  /** Small uppercase kicker shown above the title. */
  eyebrow?: string
  title: ReactNode
  description?: ReactNode
  align?: 'center' | 'left'
  /** Heading tag — use h1 for page headers, h2 for in-page sections. */
  titleAs?: 'h1' | 'h2'
  className?: string
}

export const SectionHeader = ({
  eyebrow,
  title,
  description,
  align = 'center',
  titleAs = 'h2',
  className,
}: SectionHeaderProps) => {
  const isCenter = align === 'center'
  const Heading = titleAs

  return (
    <div className={cn(isCenter ? 'text-center' : 'text-left', className)}>
      {eyebrow && (
        <div
          className={cn(
            'mb-5 inline-flex items-center gap-2 rounded-full border border-brand/30 bg-brand/10 px-4 py-1.5',
            isCenter && 'mx-auto',
          )}
        >
          <span className="size-1.5 rounded-full bg-brand" />
          <span className="text-xs font-semibold uppercase tracking-wider text-brand">
            {eyebrow}
          </span>
        </div>
      )}

      <Heading className="font-paladins text-4xl uppercase tracking-wider text-white drop-shadow-[0_0_15px_rgba(59,130,246,0.25)] sm:text-5xl lg:text-6xl">
        {title}
      </Heading>

      {description && (
        <p
          className={cn(
            'mt-5 text-lg text-zinc-400',
            isCenter ? 'mx-auto max-w-2xl' : 'max-w-2xl',
          )}
        >
          {description}
        </p>
      )}
    </div>
  )
}
