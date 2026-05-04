/**
 * File: components/public/tournaments/tournament-detail.tsx
 * Description: Server-rendered public tournament detail orchestrator with two-column layout.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

'use client'

import { ChevronLeft, ScrollText, Shield, Users } from 'lucide-react'
import Link from 'next/link'
import { ContentCard } from '@/components/public/tournaments/detail/tournament-detail-shared'
import { TournamentHeroGallery } from '@/components/public/tournaments/detail/tournament-hero-gallery'
import { TournamentPrizeBanner } from '@/components/public/tournaments/detail/tournament-prize-banner'
import {
  TournamentRegistrantsSolo,
  TournamentRegistrantsTeam,
} from '@/components/public/tournaments/detail/tournament-registrants'
import { TournamentSidebar } from '@/components/public/tournaments/detail/tournament-sidebar'
import { TournamentTabs } from '@/components/public/tournaments/detail/tournament-tabs'
import { RichText } from '@/components/ui/rich-text'
import { ROUTES } from '@/lib/config/routes'
import type {
  AvailableTeam,
  PublicTournamentDetail,
  PublicTournamentRegistrant,
  PublicTournamentTeamRegistrant,
  UserTournamentRegistrationState,
} from '@/lib/types/tournament'
import { pluralize } from '@/lib/utils/formatting'
import {
  extractTwitchChannel,
  getTournamentRegistrationBadge,
} from '@/lib/utils/tournament-status'
import { TournamentFormat } from '@/prisma/generated/prisma/enums'

interface TournamentDetailProps {
  tournament: PublicTournamentDetail
  twitchUsername?: string
  availableTeams: AvailableTeam[]
  registrationState: UserTournamentRegistrationState | null
  isAuthenticated: boolean
  registrants: PublicTournamentRegistrant[]
  teamRegistrants: PublicTournamentTeamRegistrant[]
}

export const TournamentDetail = ({
  tournament,
  twitchUsername,
  availableTeams,
  registrationState,
  isAuthenticated,
  registrants,
  teamRegistrants,
}: TournamentDetailProps) => {
  const registrationBadge = getTournamentRegistrationBadge(tournament)

  const twitchChannel = tournament.streamUrl
    ? extractTwitchChannel(tournament.streamUrl)
    : twitchUsername

  const registrantCount =
    tournament.format === TournamentFormat.SOLO
      ? tournament._count.registrations
      : tournament._count.teams

  const registrantLabel =
    tournament.format === TournamentFormat.SOLO ? 'inscrit' : 'équipe'

  const registrantCountText = tournament.maxTeams
    ? `${registrantCount} / ${tournament.maxTeams}`
    : `${registrantCount} ${registrantLabel}${pluralize(registrantCount)}`

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8 mt-28 px-4 lg:px-0">
      {/* Back link */}
      <Link
        href={ROUTES.TOURNAMENTS}
        className="group inline-flex items-center gap-2 text-sm text-zinc-500 transition-colors duration-300 hover:text-white"
      >
        <ChevronLeft className="size-4 transition-transform duration-300 group-hover:-translate-x-0.5" />
        Retour aux tournois
      </Link>

      {/* Hero carousel */}
      <TournamentHeroGallery
        tournament={tournament}
        registrationBadge={registrationBadge}
      />

      {/* Two-column layout */}
      <div className="flex flex-col gap-8 lg:flex-row">
        {/* Sidebar — first in DOM for mobile, right column on desktop */}
        <TournamentSidebar
          tournament={tournament}
          registrationPhase={registrationBadge.phase}
          registrationState={registrationState}
          isAuthenticated={isAuthenticated}
          availableTeams={availableTeams}
        />

        {/* Main content */}
        <div className="min-w-0 flex-1 space-y-6">
          {/* Description */}
          {tournament.description && (
            <ContentCard icon={ScrollText} title="Description">
              <RichText content={tournament.description} />
            </ContentCard>
          )}

          {/* Rules */}
          {tournament.rules && (
            <ContentCard icon={Shield} title="Règlement">
              <RichText content={tournament.rules} />
            </ContentCard>
          )}

          {/* Prize (full-width version for main content on mobile-only — hidden on desktop since it's in sidebar) */}
          {tournament.prize && (
            <div className="lg:hidden">
              <TournamentPrizeBanner prize={tournament.prize} />
            </div>
          )}

          {/* No description or rules */}
          {!tournament.description && !tournament.rules && (
            <div className="rounded-3xl border border-white/5 bg-white/2 p-8 text-center">
              <p className="text-sm text-zinc-500">
                Aucun détail supplémentaire pour ce tournoi.
              </p>
            </div>
          )}

          {/* Registrants section */}
          {tournament.showRegistrants && (
            <div id="inscrits">
              <ContentCard
                icon={Users}
                title="Inscrits"
                titleExtra={
                  <span className="ml-auto text-xs font-normal text-zinc-500">
                    {registrantCountText}
                  </span>
                }
              >
                {tournament.format === TournamentFormat.TEAM ? (
                  <TournamentRegistrantsTeam teams={teamRegistrants} />
                ) : (
                  <TournamentRegistrantsSolo registrants={registrants} />
                )}
              </ContentCard>
            </div>
          )}

          {/* Stream & Bracket tabs */}
          <TournamentTabs
            tournament={tournament}
            twitchChannel={twitchChannel}
          />
        </div>
      </div>
    </div>
  )
}
