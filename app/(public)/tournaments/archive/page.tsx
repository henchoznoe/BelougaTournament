/**
 * File: app/(public)/tournaments/archive/page.tsx
 * Description: Public page listing all archived (past) tournaments with filtering, sorting, and pagination.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { ArrowLeft, Clock } from 'lucide-react'
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
  getArchivedTournamentsFiltered,
  PUBLIC_TOURNAMENTS_PAGE_SIZE,
} from '@/lib/services/tournaments'
import { parsePublicTournamentFilters } from '@/lib/validations/tournaments'

export const metadata: Metadata = {
  title: 'Tournois passés',
  description: 'Consultez les tournois passés de la communauté Belouga.',
}

interface ArchivePageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

const ArchivePage = async ({ searchParams }: ArchivePageProps) => {
  const params = await searchParams
  const filters = parsePublicTournamentFilters(params, 'date_desc')
  const { tournaments, total, page, pageSize, totalPages } =
    await getArchivedTournamentsFiltered(filters)

  const hasActiveFilters =
    filters.search !== '' || filters.format !== '' || filters.type !== ''

  return (
    <section className="relative px-4 pb-20 pt-32 md:pt-40">
      <PageHeader
        title="Archives"
        description="Retrouvez tous les tournois passés de la communauté."
      />

      <div className="mx-auto w-full max-w-5xl space-y-6">
        {/* Back link */}
        <div className="flex justify-center">
          <Link
            href={ROUTES.TOURNAMENTS}
            className="group inline-flex items-center gap-2 rounded-full border border-white/5 bg-white/2 px-5 py-2.5 text-sm text-zinc-400 transition-all duration-300 hover:border-white/10 hover:bg-white/4 hover:text-white"
          >
            <ArrowLeft className="size-4 transition-colors duration-300 group-hover:text-blue-400" />
            Retour aux tournois
          </Link>
        </div>

        {/* Filters toolbar */}
        <Suspense fallback={<div className="h-10" />}>
          <TournamentFilters
            filters={filters}
            basePath={ROUTES.TOURNAMENTS_ARCHIVE}
          />
        </Suspense>

        {/* Tournament grid */}
        <Suspense
          fallback={
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: PUBLIC_TOURNAMENTS_PAGE_SIZE }).map(
                (_, i) => (
                  <Skeleton
                    // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton placeholders
                    key={i}
                    className="h-64 rounded-3xl border border-white/5 bg-white/2"
                  />
                ),
              )}
            </div>
          }
        >
          <TournamentGrid
            tournaments={tournaments}
            hasActiveFilters={hasActiveFilters}
            emptyIcon={<Clock className="size-8 text-zinc-600" />}
            emptyTitle="Aucun tournoi archivé"
            emptyDescription="Il n'y a pas encore de tournoi archivé. Les tournois terminés apparaîtront ici."
          />
        </Suspense>

        {/* Pagination */}
        <Suspense fallback={null}>
          <TournamentPagination
            total={total}
            page={page}
            pageSize={pageSize}
            totalPages={totalPages}
            basePath={ROUTES.TOURNAMENTS_ARCHIVE}
            filters={filters}
          />
        </Suspense>
      </div>
    </section>
  )
}

export default ArchivePage
