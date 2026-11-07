/**
 * File: app/(public)/tournaments/[slug]/loading.tsx
 * Description: Loading state matching the public tournament detail sections.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
  return (
    <div
      role="status"
      aria-busy="true"
      className="mx-auto max-w-6xl space-y-6 px-4 pb-20 pt-28"
    >
      <span className="sr-only">Chargement du tournoi…</span>
      <div aria-hidden="true" className="space-y-6">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-96 w-full rounded-3xl" />
        <Skeleton className="h-16 w-full rounded-2xl" />
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
          <Skeleton className="h-96 rounded-2xl" />
          <Skeleton className="h-72 rounded-2xl" />
        </div>
        <Skeleton className="mx-auto h-64 max-w-4xl rounded-2xl" />
      </div>
    </div>
  )
}
