/**
 * File: components/ui/skeleton.tsx
 * Description: Reusable Skeleton component from shadcn/ui.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils/cn'

const Skeleton = ({ className, ...props }: ComponentProps<'div'>) => {
  return (
    <div
      data-slot="skeleton"
      className={cn('animate-pulse rounded-md bg-accent', className)}
      {...props}
    />
  )
}

export { Skeleton }
