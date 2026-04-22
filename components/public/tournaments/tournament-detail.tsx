/**
 * File: components/public/tournaments/tournament-detail.tsx
 * Description: Server-rendered public tournament detail orchestrator with small interactive client islands.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { ChevronLeft } from 'lucide-react'
import Link from 'next/link'
import { TournamentHeroGallery } from '@/components/public/tournaments/detail/tournament-hero-gallery'
import { TournamentPrizeBanner } from '@/components/public/tournaments/detail/tournament-prize-banner'
import { TournamentStatsGrid } from '@/components/public/tournaments/detail/tournament-stats-grid'
import { TournamentTabs } from '@/components/public/tournaments/detail/tournament-tabs'
import { ROUTES } from '@/lib/config/routes'
import type {
  AvailableTeam,
  PublicTournamentDetail,
  UserTournamentRegistrationState,
} from '@/lib/types/tournament'
import {
  extractTwitchChannel,
  getTournamentRegistrationBadge,
} from '@/lib/utils/tournament-status'

interface TournamentDetailProps {
  tournament: PublicTournamentDetail
  twitchUsername?: string
  availableTeams: AvailableTeam[]
  registrationState: UserTournamentRegistrationState | null
  isAuthenticated: boolean
}

export const TournamentDetail = ({
  tournament,
  twitchUsername,
  availableTeams,
  registrationState,
  isAuthenticated,
}: TournamentDetailProps) => {
  const registrationBadge = getTournamentRegistrationBadge(tournament)

  const twitchChannel = tournament.streamUrl
    ? extractTwitchChannel(tournament.streamUrl)
    : twitchUsername

  return (
    <div className="mx-auto w-full max-w-4xl space-y-8 mt-28 px-4 lg:px-0">
      {/* Back link */}
      <Link
        href={ROUTES.TOURNAMENTS}
        className="group inline-flex items-center gap-2 text-sm text-zinc-500 transition-colors duration-300 hover:text-white"
      >
        <ChevronLeft className="size-4 transition-transform duration-300 group-hover:-translate-x-0.5" />
        Retour aux tournois
      </Link>

      <TournamentHeroGallery
        tournament={tournament}
        registrationBadge={registrationBadge}
      />

      <TournamentStatsGrid tournament={tournament} />

      {tournament.prize && <TournamentPrizeBanner prize={tournament.prize} />}

      <TournamentTabs
        tournament={tournament}
        twitchChannel={twitchChannel}
        availableTeams={availableTeams}
        registrationState={registrationState}
        isAuthenticated={isAuthenticated}
        registrationPhase={registrationBadge.phase}
      />
    </div>
  )
}
