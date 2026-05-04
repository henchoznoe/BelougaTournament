/**
 * File: components/public/tournaments/detail/tournament-sidebar.tsx
 * Description: Sticky sidebar with registration card, tournament info, and prize for the public tournament detail view.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

'use client'

import {
  Calendar,
  Clock,
  Coins,
  DoorOpen,
  Swords,
  Timer,
  Users,
} from 'lucide-react'
import { InfoRow } from '@/components/public/tournaments/detail/tournament-detail-shared'
import { TournamentPrizeBanner } from '@/components/public/tournaments/detail/tournament-prize-banner'
import { TournamentRegistrationForm } from '@/components/public/tournaments/tournament-registration-form'
import type {
  AvailableTeam,
  PublicTournamentDetail,
  UserTournamentRegistrationState,
} from '@/lib/types/tournament'
import {
  formatCentimes,
  formatDateTime,
  pluralize,
} from '@/lib/utils/formatting'
import type { TournamentRegistrationPhase } from '@/lib/utils/tournament-status'
import {
  RegistrationStatus,
  TournamentFormat,
} from '@/prisma/generated/prisma/enums'

interface TournamentSidebarProps {
  tournament: PublicTournamentDetail
  registrationPhase: TournamentRegistrationPhase
  registrationState: UserTournamentRegistrationState | null
  isAuthenticated: boolean
  availableTeams: AvailableTeam[]
}

export const TournamentSidebar = ({
  tournament,
  registrationPhase,
  registrationState,
  isAuthenticated,
  availableTeams,
}: TournamentSidebarProps) => {
  const entryFee =
    tournament.entryFeeAmount && tournament.entryFeeCurrency
      ? formatCentimes(tournament.entryFeeAmount, tournament.entryFeeCurrency)
      : null

  const playerCount =
    tournament.format === TournamentFormat.SOLO
      ? tournament._count.registrations
      : tournament._count.teams

  const playerLabel =
    tournament.format === TournamentFormat.SOLO ? 'inscrit' : 'équipe'

  const playerValue = tournament.maxTeams
    ? `${playerCount} / ${tournament.maxTeams}`
    : `${playerCount} ${playerLabel}${pluralize(playerCount)}`

  return (
    <aside className="w-full space-y-6 lg:sticky lg:top-32 lg:w-85 lg:shrink-0 lg:self-start">
      {/* Registration card */}
      <div className="relative overflow-hidden rounded-3xl border border-blue-500/20 bg-linear-to-br from-blue-500/5 via-white/2 to-purple-500/5 p-5 shadow-[0_0_60px_rgba(59,130,246,0.12)]">
        <div className="pointer-events-none absolute -right-20 -top-20 size-56 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -left-20 -bottom-20 size-56 rounded-full bg-purple-500/10 blur-3xl" />
        <div className="relative z-10 space-y-4">
          <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-white">
            <Clock className="size-4 text-blue-400" />
            Inscription
          </h3>

          {registrationPhase === 'open' ? (
            <>
              {registrationState?.status !== RegistrationStatus.CONFIRMED && (
                <p className="text-center text-sm text-zinc-400">
                  Inscriptions ouvertes jusqu&apos;au{' '}
                  <span className="font-medium text-zinc-300">
                    {formatDateTime(tournament.registrationClose)}
                  </span>
                </p>
              )}
              <TournamentRegistrationForm
                tournamentId={tournament.id}
                fields={tournament.fields}
                format={tournament.format}
                teamSize={tournament.teamSize}
                availableTeams={availableTeams}
                tournament={tournament}
                registrationState={registrationState}
                isAuthenticated={isAuthenticated}
                calendarData={{
                  title: tournament.title,
                  slug: tournament.slug,
                  startDate: tournament.startDate,
                  endDate: tournament.endDate,
                  description: tournament.description,
                  games: tournament.games,
                }}
              />
            </>
          ) : (
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              {registrationPhase === 'archived' ? (
                <p className="text-sm text-zinc-500">Ce tournoi est terminé.</p>
              ) : registrationPhase === 'upcoming' ? (
                <p className="text-sm text-zinc-500">
                  Inscriptions dès le{' '}
                  <span className="font-medium text-zinc-400">
                    {formatDateTime(tournament.registrationOpen)}
                  </span>
                </p>
              ) : (
                <p className="text-sm text-zinc-500">
                  Inscriptions fermées depuis le{' '}
                  <span className="font-medium text-zinc-400">
                    {formatDateTime(tournament.registrationClose)}
                  </span>
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Tournament info card */}
      <div className="relative overflow-hidden rounded-3xl border border-white/5 bg-white/2 p-5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] backdrop-blur-xl">
        <div className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full bg-blue-500/5 blur-3xl" />
        <div className="relative z-10">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-white">
            <Swords className="size-4 text-blue-400" />
            Informations
          </h3>
          <div className="divide-y divide-white/5">
            <InfoRow
              icon={Swords}
              label="Format"
              value={
                tournament.format === TournamentFormat.SOLO
                  ? 'Solo'
                  : `Équipe de ${tournament.teamSize}`
              }
            />
            <InfoRow
              icon={Users}
              label={
                tournament.format === TournamentFormat.SOLO
                  ? 'Inscrits'
                  : 'Équipes'
              }
              value={
                tournament.showRegistrants ? (
                  <span className="flex items-center gap-2">
                    <span className="font-semibold text-white">
                      {playerValue}
                    </span>
                    <a
                      href="#inscrits"
                      className="text-xs text-blue-400 transition-colors hover:text-blue-300"
                    >
                      voir la liste
                    </a>
                  </span>
                ) : (
                  <span className="font-semibold text-white">
                    {playerValue}
                  </span>
                )
              }
            />
            <InfoRow
              icon={Calendar}
              label="Début"
              value={formatDateTime(tournament.startDate)}
            />
            <InfoRow
              icon={Timer}
              label="Fin"
              value={formatDateTime(tournament.endDate)}
            />
            <InfoRow
              icon={DoorOpen}
              label="Ouverture inscriptions"
              value={formatDateTime(tournament.registrationOpen)}
            />
            <InfoRow
              icon={DoorOpen}
              label="Fermeture inscriptions"
              value={formatDateTime(tournament.registrationClose)}
            />
            {entryFee && (
              <InfoRow
                icon={Coins}
                label="Frais d'inscription"
                value={entryFee}
              />
            )}
          </div>
        </div>
      </div>

      {/* Prize banner */}
      {tournament.prize && (
        <TournamentPrizeBanner prize={tournament.prize} compact />
      )}
    </aside>
  )
}
