/**
 * File: components/admin/tournaments/tournament-detail.tsx
 * Description: Tournament overview orchestrator — composes stats, info cards, rich-text sections, and metadata footer.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

'use client'

import { TournamentOverviewCards } from '@/components/admin/tournaments/detail/tournament-overview-cards'
import { TournamentOverviewSections } from '@/components/admin/tournaments/detail/tournament-overview-sections'
import { TournamentStatsSummary } from '@/components/admin/tournaments/detail/tournament-stats-summary'
import type { TournamentDetail as TournamentDetailType } from '@/lib/types/tournament'
import { formatDate } from '@/lib/utils/formatting'

interface TournamentOverviewProps {
  tournament: TournamentDetailType
}

export const TournamentOverview = ({ tournament }: TournamentOverviewProps) => {
  return (
    <div className="space-y-6">
      <TournamentStatsSummary tournament={tournament} />
      <TournamentOverviewCards tournament={tournament} />
      <TournamentOverviewSections tournament={tournament} />

      {/* Metadata footer */}
      <div className="flex flex-wrap gap-4 text-xs text-zinc-600">
        <span>Créé le {formatDate(tournament.createdAt)}</span>
        <span>Modifié le {formatDate(tournament.updatedAt)}</span>
        <span className="font-mono">ID: {tournament.id}</span>
      </div>
    </div>
  )
}
