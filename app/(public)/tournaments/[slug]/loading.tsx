/**
 * File: app/(public)/tournaments/[slug]/loading.tsx
 * Description: Route-level loading skeleton for the public tournament detail page.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { Skeleton } from '@/components/ui/skeleton'

const TournamentLoadingPage = () => {
  return (
    <section className="relative px-4 pb-20 pt-32 md:pt-40">
      <div className="mx-auto w-full max-w-6xl space-y-8">
        <Skeleton className="h-6 w-40 rounded-md bg-white/2" />
        <Skeleton className="h-72 rounded-3xl border border-white/5 bg-white/2" />

        <div className="flex flex-col gap-8 lg:flex-row">
          {/* Sidebar skeleton (first in DOM for mobile) */}
          <div className="w-full space-y-6 lg:order-last lg:w-85 lg:shrink-0">
            <Skeleton className="h-48 rounded-3xl border border-white/5 bg-white/2" />
            <Skeleton className="h-64 rounded-3xl border border-white/5 bg-white/2" />
          </div>

          {/* Main content skeleton */}
          <div className="min-w-0 flex-1 space-y-6">
            <Skeleton className="h-48 rounded-3xl border border-white/5 bg-white/2" />
            <Skeleton className="h-36 rounded-3xl border border-white/5 bg-white/2" />
            <Skeleton className="h-64 rounded-3xl border border-white/5 bg-white/2" />
          </div>
        </div>
      </div>
    </section>
  )
}

export default TournamentLoadingPage
