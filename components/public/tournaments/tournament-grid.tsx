/**
 * File: components/public/tournaments/tournament-grid.tsx
 * Description: Grid of TournamentCard items with empty state for filtered public tournament lists.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { Trophy } from 'lucide-react'
import { TournamentCard } from '@/components/public/tournaments/tournament-card'
import type { PublicTournamentListItem } from '@/lib/types/tournament'

interface TournamentGridProps {
  tournaments: PublicTournamentListItem[]
  hasActiveFilters: boolean
  emptyIcon?: React.ReactNode
  emptyTitle?: string
  emptyDescription?: string
  emptyFilteredDescription?: string
}

export const TournamentGrid = ({
  tournaments,
  hasActiveFilters,
  emptyIcon,
  emptyTitle = 'Aucun tournoi pour le moment',
  emptyDescription = "Aucun tournoi n'est actuellement disponible. Revenez bientôt pour découvrir nos prochaines compétitions.",
  emptyFilteredDescription = 'Aucun tournoi ne correspond à vos critères. Essayez de modifier ou réinitialiser les filtres.',
}: TournamentGridProps) => {
  if (tournaments.length === 0) {
    return (
      <div className="relative overflow-hidden rounded-3xl border border-white/5 bg-white/2 p-6 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] backdrop-blur-xl md:p-8">
        <div className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full bg-blue-500/5 blur-3xl" />
        <div className="relative z-10 flex flex-col items-center gap-4 py-8 text-center">
          <div className="flex size-16 items-center justify-center rounded-2xl border border-white/5 bg-white/5">
            {emptyIcon ?? <Trophy className="size-8 text-zinc-600" />}
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-white">
              {hasActiveFilters ? 'Aucun résultat' : emptyTitle}
            </h2>
            <p className="mx-auto max-w-md text-sm text-zinc-500">
              {hasActiveFilters ? emptyFilteredDescription : emptyDescription}
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {tournaments.map(tournament => (
        <TournamentCard key={tournament.id} tournament={tournament} />
      ))}
    </div>
  )
}
