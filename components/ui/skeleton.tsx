/**
 * File: components/ui/skeleton.tsx
 * Description: Skeleton component logic and UI.
 * Author: Noé Henchoz
 * Date: 2025-12-07
 * License: MIT
 */

// ----------------------------------------------------------------------
// IMPORTS
// ----------------------------------------------------------------------

import { cn } from '@/lib/utils/cn'

// ----------------------------------------------------------------------
// COMPONENT
// ----------------------------------------------------------------------

const Skeleton = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-zinc-800', className)}
      {...props}
    />
  )
}

export { Skeleton }
