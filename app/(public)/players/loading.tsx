/**
 * File: app/(public)/players/loading.tsx
 * Description: Route-level loading skeleton for the players list page.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { Skeleton } from '@/components/ui/skeleton'

const PlayersLoadingPage = () => {
  return (
    <section className="relative px-4 pb-20 pt-32 md:pt-40">
      <div className="mb-16 text-center">
        <Skeleton className="mx-auto h-12 w-48" />
        <Skeleton className="mx-auto mt-4 h-6 w-80" />
      </div>
      <div className="mx-auto grid w-full max-w-4xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Skeleton className="h-40 rounded-2xl border border-white/5 bg-white/2" />
        <Skeleton className="h-40 rounded-2xl border border-white/5 bg-white/2" />
        <Skeleton className="h-40 rounded-2xl border border-white/5 bg-white/2" />
        <Skeleton className="h-40 rounded-2xl border border-white/5 bg-white/2" />
        <Skeleton className="h-40 rounded-2xl border border-white/5 bg-white/2" />
        <Skeleton className="h-40 rounded-2xl border border-white/5 bg-white/2" />
      </div>
    </section>
  )
}

export default PlayersLoadingPage
