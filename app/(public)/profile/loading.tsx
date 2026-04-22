/**
 * File: app/(public)/profile/loading.tsx
 * Description: Route-level loading skeleton for the user profile page.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { Skeleton } from '@/components/ui/skeleton'

const ProfileLoadingPage = () => {
  return (
    <section className="relative px-4 pb-20 pt-32 md:pt-40">
      <div className="mx-auto w-full max-w-2xl space-y-6">
        <Skeleton className="h-64 rounded-3xl border border-white/5 bg-white/2" />
        <Skeleton className="h-48 rounded-3xl border border-white/5 bg-white/2" />
        <Skeleton className="h-16 rounded-3xl border border-white/5 bg-white/2" />
      </div>
    </section>
  )
}

export default ProfileLoadingPage
