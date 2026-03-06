/**
 * File: app/(public)/profil/tournois/page.tsx
 * Description: Dedicated page for the user's tournament history.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import type { Metadata } from 'next'
import { Suspense } from 'react'
import { ProfileTournamentHistory } from '@/components/features/profile/profile-tournament-history'
import { PageHeader } from '@/components/ui/page-header'
import { Skeleton } from '@/components/ui/skeleton'

export const metadata: Metadata = {
  title: 'Mes Tournois',
  description: 'Consultez votre historique de participations aux tournois.',
}

const TournamentsHistoryPage = () => {
  return (
    <section className="relative px-4 pb-20 pt-32 md:pt-40">
      <PageHeader
        title="Mes Tournois"
        description="Retrouvez l'historique de vos participations."
      />
      <Suspense
        fallback={
          <div className="mx-auto w-full max-w-2xl space-y-6">
            <Skeleton className="h-8 w-40 rounded-lg" />
            <Skeleton className="h-64 rounded-3xl border border-white/5 bg-white/2" />
          </div>
        }
      >
        <ProfileTournamentHistory />
      </Suspense>
    </section>
  )
}

export default TournamentsHistoryPage
