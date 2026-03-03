/**
 * File: components/features/landing/tournaments-skeleton.tsx
 * Description: Skeleton fallback for the TournamentsSection on the landing page.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { Skeleton } from '@/components/ui/skeleton'

export const TournamentsSkeleton = () => {
  return (
    <section className="relative container mx-auto px-4 py-24">
      {/* Section Header Skeleton */}
      <div className="mb-20 flex flex-col items-center gap-6">
        <Skeleton className="h-8 w-32 rounded-full" />
        <Skeleton className="h-12 w-80 rounded-lg" />
        <Skeleton className="h-6 w-96 rounded-lg" />
      </div>

      {/* Card Grid Skeleton */}
      <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Skeleton className="h-72 rounded-3xl border border-white/5 bg-white/2" />
        <Skeleton className="h-72 rounded-3xl border border-white/5 bg-white/2" />
        <Skeleton className="h-72 rounded-3xl border border-white/5 bg-white/2" />
      </div>
    </section>
  )
}
