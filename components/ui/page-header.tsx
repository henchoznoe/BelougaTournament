/**
 * File: components/ui/page-header.tsx
 * Description: Reusable page header with title and description.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import type { ReactNode } from 'react'
import { cn } from '@/lib/utils/cn'

interface PageHeaderProps {
  title: string
  description?: ReactNode
  className?: string
}

export const PageHeader = ({
  title,
  description,
  className,
}: PageHeaderProps) => {
  return (
    <>
      {/* Background Glows */}
      <div className="pointer-events-none absolute left-1/2 top-0 -z-10 h-96 w-full max-w-3xl -translate-x-1/2 bg-blue-500/10 blur-[120px]" />
      <div className={cn('mb-16 text-center', className)}>
        <h1 className="mb-4 font-paladins text-4xl tracking-wider text-white drop-shadow-[0_0_15px_rgba(59,130,246,0.5)] md:text-5xl lg:text-6xl">
          {title}
        </h1>
        {description && (
          <p className="mx-auto max-w-2xl text-lg text-zinc-400">
            {description}
          </p>
        )}
      </div>
    </>
  )
}
