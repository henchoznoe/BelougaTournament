/**
 * File: components/public/tournaments/tournament-browser.tsx
 * Description: Client-side filtering and pagination over a cached public tournament list.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

'use client'

import { Clock, Trophy } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { useMemo } from 'react'
import { TournamentFilters } from '@/components/public/tournaments/tournament-filters'
import { TournamentGrid } from '@/components/public/tournaments/tournament-grid'
import { TournamentPagination } from '@/components/public/tournaments/tournament-pagination'
import { PUBLIC_TOURNAMENTS_PAGE_SIZE } from '@/lib/config/constants/tournaments'
import type { PublicTournamentListItem } from '@/lib/types/tournament'
import {
  parsePublicTournamentFilters,
  type TournamentSortOption,
} from '@/lib/validations/tournaments'

interface TournamentBrowserProps {
  basePath: string
  defaultSort: TournamentSortOption
  tournaments: PublicTournamentListItem[]
  variant: 'archive' | 'published'
}

export const TournamentBrowser = ({
  basePath,
  defaultSort,
  tournaments,
  variant,
}: TournamentBrowserProps) => {
  const searchParams = useSearchParams()
  const filters = parsePublicTournamentFilters(
    Object.fromEntries(searchParams.entries()),
    defaultSort,
  )

  const filtered = useMemo(() => {
    const search = filters.search.toLocaleLowerCase('fr-CH')
    const rows = tournaments.filter(tournament => {
      const matchesSearch =
        !search ||
        tournament.title.toLocaleLowerCase('fr-CH').includes(search) ||
        tournament.games.some(game =>
          game.toLocaleLowerCase('fr-CH').includes(search),
        )
      return (
        matchesSearch &&
        (!filters.format || tournament.format === filters.format) &&
        (!filters.type || tournament.registrationType === filters.type)
      )
    })

    return rows.toSorted((a, b) => {
      switch (filters.sort) {
        case 'date_asc':
          return (
            new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
          )
        case 'date_desc':
          return (
            new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
          )
        case 'title_asc':
          return a.title.localeCompare(b.title, 'fr-CH')
        case 'title_desc':
          return b.title.localeCompare(a.title, 'fr-CH')
        case 'registrations_desc':
          return b._count.registrations - a._count.registrations
      }
      /* v8 ignore next */
      return 0
    })
  }, [filters.format, filters.search, filters.sort, filters.type, tournaments])

  const total = filtered.length
  const totalPages = Math.max(
    1,
    Math.ceil(total / PUBLIC_TOURNAMENTS_PAGE_SIZE),
  )
  const pageRows = filtered.slice(
    (filters.page - 1) * PUBLIC_TOURNAMENTS_PAGE_SIZE,
    filters.page * PUBLIC_TOURNAMENTS_PAGE_SIZE,
  )
  const hasActiveFilters = Boolean(
    filters.search || filters.format || filters.type,
  )

  return (
    <>
      <TournamentFilters filters={filters} basePath={basePath} />
      <TournamentGrid
        tournaments={pageRows}
        hasActiveFilters={hasActiveFilters}
        emptyIcon={
          variant === 'archive' ? (
            <Clock className="size-8 text-zinc-600" />
          ) : (
            <Trophy className="size-8 text-zinc-600" />
          )
        }
        emptyTitle={
          variant === 'archive'
            ? 'Aucun tournoi archivé'
            : 'Aucun tournoi pour le moment'
        }
        emptyDescription={
          variant === 'archive'
            ? "Il n'y a pas encore de tournoi archivé. Les tournois terminés apparaîtront ici."
            : "Aucun tournoi n'est actuellement disponible. Revenez bientôt pour découvrir nos prochaines compétitions."
        }
      />
      <TournamentPagination
        total={total}
        page={filters.page}
        pageSize={PUBLIC_TOURNAMENTS_PAGE_SIZE}
        totalPages={totalPages}
        basePath={basePath}
        filters={filters}
      />
    </>
  )
}
