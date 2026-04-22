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
      <div className="mx-auto w-full max-w-4xl space-y-8">
        <Skeleton className="h-6 w-40 rounded-md bg-white/2" />
        <Skeleton className="h-72 rounded-3xl border border-white/5 bg-white/2" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Skeleton className="h-24 rounded-2xl border border-white/5 bg-white/2" />
          <Skeleton className="h-24 rounded-2xl border border-white/5 bg-white/2" />
          <Skeleton className="h-24 rounded-2xl border border-white/5 bg-white/2" />
          <Skeleton className="h-24 rounded-2xl border border-white/5 bg-white/2" />
        </div>
        <Skeleton className="h-48 rounded-3xl border border-white/5 bg-white/2" />
        <Skeleton className="h-64 rounded-3xl border border-white/5 bg-white/2" />
      </div>
    </section>
  )
}

export default TournamentLoadingPage
