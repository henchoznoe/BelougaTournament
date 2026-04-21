/**
 * File: components/public/tournaments/detail/tournament-stats-grid.tsx
 * Description: Stats grid (format, players/teams, start/end dates) for the public tournament detail view.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

'use client'

import { Calendar, Clock, Swords, Users } from 'lucide-react'
import { StatCard } from '@/components/public/tournaments/detail/tournament-detail-shared'
import type { PublicTournamentDetail } from '@/lib/types/tournament'
import { formatDate } from '@/lib/utils/formatting'
import { TournamentFormat } from '@/prisma/generated/prisma/enums'

interface TournamentStatsGridProps {
  tournament: PublicTournamentDetail
}

export const TournamentStatsGrid = ({
  tournament,
}: TournamentStatsGridProps) => (
  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
    <StatCard
      icon={Swords}
      label="Format"
      value={
        tournament.format === TournamentFormat.SOLO
          ? 'Solo'
          : `${tournament.teamSize}v${tournament.teamSize}`
      }
    />
    <StatCard
      icon={Users}
      label={
        tournament.format === TournamentFormat.SOLO ? 'Joueurs' : 'Équipes'
      }
      value={
        tournament.format === TournamentFormat.SOLO
          ? tournament.maxTeams
            ? `${tournament._count.registrations} / ${tournament.maxTeams}`
            : `${tournament._count.registrations}`
          : tournament.maxTeams
            ? `${tournament._count.teams} / ${tournament.maxTeams}`
            : `${tournament._count.teams}`
      }
    />
    <StatCard
      icon={Calendar}
      label="Début"
      value={formatDate(tournament.startDate)}
    />
    <StatCard icon={Clock} label="Fin" value={formatDate(tournament.endDate)} />
  </div>
)
