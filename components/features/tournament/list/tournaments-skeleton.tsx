/**
 * File: components/features/tournament/list/tournaments-skeleton.tsx
 * Description: Skeleton component for the tournaments section on the landing page.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { Skeleton } from "@/components/ui/skeleton"

const CONFIG = {
  SKELETON_COUNT: 3,
} as const

const TournamentCardSkeleton = () => {
  return (
    <div className="flex h-full flex-col rounded-xl border border-zinc-800 bg-zinc-900/80 p-6">
      <div className="mb-4 flex items-center justify-between">
        <Skeleton className="h-6 w-16 rounded-full bg-zinc-800" />
        <Skeleton className="h-4 w-20 bg-zinc-800" />
      </div>

      <Skeleton className="mb-2 h-8 w-3/4 bg-zinc-800" />
      <Skeleton className="mb-6 h-4 w-full bg-zinc-800" />

      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Skeleton className="size-8 rounded-lg bg-zinc-800" />
          <Skeleton className="h-4 w-32 bg-zinc-800" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="size-8 rounded-lg bg-zinc-800" />
          <Skeleton className="h-4 w-40 bg-zinc-800" />
        </div>
      </div>

      <div className="mt-auto pt-6">
        <Skeleton className="h-10 w-full rounded-lg bg-zinc-800" />
      </div>
    </div>
  )
}

export const TournamentsSkeleton = () => {
  return (
    <section className="container mx-auto px-4" id="tournaments" aria-hidden="true">
      <div className="mb-12 flex items-end justify-between">
        <div>
          <Skeleton className="h-10 w-64 rounded-lg bg-zinc-800" />
          <Skeleton className="mt-2 h-1 w-20 rounded-full bg-zinc-800" />
        </div>
        <Skeleton className="h-10 w-32 rounded-lg bg-zinc-800" />
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: CONFIG.SKELETON_COUNT }).map((_, index) => (
          <TournamentCardSkeleton key={index} />
        ))}
      </div>
    </section>
  )
}
