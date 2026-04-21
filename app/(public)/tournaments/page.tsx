/**
 * File: app/(public)/tournaments/page.tsx
 * Description: Public page listing all published tournaments with filtering, sorting, and pagination.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { Archive, Trophy } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'
import { TournamentFilters } from '@/components/public/tournaments/tournament-filters'
import { TournamentGrid } from '@/components/public/tournaments/tournament-grid'
import { TournamentPagination } from '@/components/public/tournaments/tournament-pagination'
import { PageHeader } from '@/components/ui/page-header'
import { Skeleton } from '@/components/ui/skeleton'
import { ROUTES } from '@/lib/config/routes'
import {
  getPublishedTournamentsFiltered,
  PUBLIC_TOURNAMENTS_PAGE_SIZE,
} from '@/lib/services/tournaments-public'
import { parsePublicTournamentFilters } from '@/lib/validations/tournaments'

export const metadata: Metadata = {
  title: 'Tournois',
  description: 'Découvrez les tournois à venir et inscrivez-vous.',
}

type PublicSearchParams = Record<string, string | string[] | undefined>

interface TournamentsPageProps {
  searchParams: Promise<PublicSearchParams>
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
            className="h-64 rounded-3xl border border-white/5 bg-white/2"
          />
        ))}
      </div>
    </>
  )
}

const TournamentsContent = async ({ searchParams }: TournamentsPageProps) => {
  const params = await searchParams
  const filters = parsePublicTournamentFilters(params, 'date_asc')
  const { tournaments, total, page, pageSize, totalPages } =
    await getPublishedTournamentsFiltered(filters)

  const hasActiveFilters =
    filters.search !== '' || filters.format !== '' || filters.type !== ''

  return (
    <>
      <TournamentFilters filters={filters} basePath={ROUTES.TOURNAMENTS} />
      <TournamentGrid
        tournaments={tournaments}
        hasActiveFilters={hasActiveFilters}
        emptyIcon={<Trophy className="size-8 text-zinc-600" />}
        emptyTitle="Aucun tournoi pour le moment"
        emptyDescription="Aucun tournoi n'est actuellement disponible. Revenez bientôt pour découvrir nos prochaines compétitions."
      />
      <TournamentPagination
        total={total}
        page={page}
        pageSize={pageSize}
        totalPages={totalPages}
        basePath={ROUTES.TOURNAMENTS}
        filters={filters}
      />
      <div className="flex justify-center pt-2">
        <Link
          href={ROUTES.TOURNAMENTS_ARCHIVE}
          className="group inline-flex items-center gap-2 rounded-full border border-white/5 bg-white/2 px-5 py-2.5 text-sm text-zinc-400 transition-all duration-300 hover:border-white/10 hover:bg-white/4 hover:text-white"
        >
          <Archive className="size-4 transition-colors duration-300 group-hover:text-blue-400" />
          Voir les tournois passés
        </Link>
      </div>
    </>
  )
}

const TournamentsPage = ({ searchParams }: TournamentsPageProps) => {
  return (
    <section className="relative px-4 pb-20 pt-32 md:pt-40">
      <PageHeader
        title="Tournois"
        description="Découvrez nos tournois à venir et inscrivez-vous pour participer."
      />

      <div className="mx-auto w-full max-w-5xl space-y-6">
        <Suspense fallback={<TournamentListFallback />}>
          <TournamentsContent searchParams={searchParams} />
        </Suspense>
      </div>
    </section>
  )
}

export default TournamentsPage
