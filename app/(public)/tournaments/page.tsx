/**
 * File: app/(public)/tournaments/page.tsx
 * Description: Public page listing all published tournaments with filtering, sorting, and pagination.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { Archive } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'
import { TournamentBrowser } from '@/components/public/tournaments/tournament-browser'
import { PageHeader } from '@/components/ui/page-header'
import { Skeleton } from '@/components/ui/skeleton'
import { PUBLIC_TOURNAMENTS_PAGE_SIZE } from '@/lib/config/constants/tournaments'
import { ROUTES } from '@/lib/config/routes'
import { getPublishedTournaments } from '@/lib/services/tournaments-public'

export const metadata: Metadata = {
  title: 'Tournois',
  description: 'Découvrez les tournois à venir et inscrivez-vous.',
}

const TournamentListFallback = () => {
  return (
    <>
      <div className="h-10" />
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: PUBLIC_TOURNAMENTS_PAGE_SIZE }).map((_, i) => (
          <Skeleton
            // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton placeholders
            key={i}
            className="h-64 rounded-2xl border border-surface-border bg-surface"
          />
        ))}
      </div>
    </>
  )
}

const TournamentsContent = async () => {
  const tournaments = await getPublishedTournaments()
  return (
    <>
      <TournamentBrowser
        tournaments={tournaments}
        basePath={ROUTES.TOURNAMENTS}
        defaultSort="date_asc"
        variant="published"
      />
      <div className="flex justify-center pt-2">
        <Link
          href={ROUTES.TOURNAMENTS_ARCHIVE}
          className="glass group inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm text-zinc-400 transition-all duration-300 hover:border-brand/20 hover:bg-surface-hover hover:text-white"
        >
          <Archive className="size-4 transition-colors duration-300 group-hover:text-brand" />
          Voir les tournois passés
        </Link>
      </div>
    </>
  )
}

const TournamentsPage = () => {
  return (
    <section className="relative px-4 pb-20 pt-32 md:pt-40">
      <PageHeader
        title="Tournois"
        description="Découvrez nos tournois à venir et inscrivez-vous pour participer."
      />

      <div className="mx-auto w-full max-w-5xl space-y-6">
        <Suspense fallback={<TournamentListFallback />}>
          <TournamentsContent />
        </Suspense>
      </div>
    </section>
  )
}

export default TournamentsPage
