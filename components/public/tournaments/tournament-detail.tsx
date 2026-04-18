/**
 * File: components/public/tournaments/tournament-detail.tsx
 * Description: Client component displaying full tournament detail with tabs (details, stream, bracket).
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

'use client'

import {
  Calendar,
  CalendarDays,
  Clock,
  Gamepad2,
  Layers,
  ScrollText,
  Swords,
  Trophy,
  Tv,
  Users,
  Video,
} from 'lucide-react'
import Link from 'next/link'
import { TwitchPlayer } from '@/components/public/stream/twitch-player'
import { TournamentRegistrationForm } from '@/components/public/tournaments/tournament-registration-form'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ROUTES } from '@/lib/config/routes'
import type {
  AvailableTeam,
  PublicTournamentDetail,
  UserTournamentRegistrationState,
} from '@/lib/types/tournament'
import { cn } from '@/lib/utils/cn'
import { formatDate, formatDateTime } from '@/lib/utils/formatting'
import {
  TournamentFormat,
  TournamentStatus,
} from '@/prisma/generated/prisma/enums'

interface TournamentDetailProps {
  tournament: PublicTournamentDetail
  twitchUsername?: string
  availableTeams: AvailableTeam[]
  registrationState: UserTournamentRegistrationState | null
  isAuthenticated: boolean
}

/** Determines the registration status label and color. */
const getRegistrationStatus = (tournament: PublicTournamentDetail) => {
  const now = new Date()
  const open = new Date(tournament.registrationOpen)
  const close = new Date(tournament.registrationClose)

  if (tournament.status === TournamentStatus.ARCHIVED) {
    return {
      label: 'Tournoi terminé',
      className: 'border-zinc-500/30 bg-zinc-500/10 text-zinc-400',
    }
  }
  if (now < open) {
    return {
      label: 'Inscriptions bientôt ouvertes',
      className: 'border-amber-500/30 bg-amber-500/10 text-amber-400',
    }
  }
  if (now >= open && now <= close) {
    return {
      label: 'Inscriptions ouvertes',
      className: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
    }
  }
  return {
    label: 'Inscriptions fermées',
    className: 'border-red-500/30 bg-red-500/10 text-red-400',
  }
}

/** Checks if registration is currently open. */
const isRegistrationOpen = (tournament: PublicTournamentDetail) => {
  if (tournament.status === TournamentStatus.ARCHIVED) return false
  const now = new Date()
  const open = new Date(tournament.registrationOpen)
  const close = new Date(tournament.registrationClose)
  return now >= open && now <= close
}

/** Extracts a Twitch channel name from a full URL, or returns the value as-is if not a URL. */
const extractTwitchChannel = (streamUrl: string): string => {
  try {
    const url = new URL(streamUrl)
    // Handle twitch.tv URLs like https://twitch.tv/channelname or https://www.twitch.tv/channelname
    if (url.hostname.includes('twitch.tv')) {
      const parts = url.pathname.split('/').filter(Boolean)
      return parts[0] ?? streamUrl
    }
    return streamUrl
  } catch {
    // Not a valid URL, treat as channel name directly
    return streamUrl
  }
}

export const TournamentDetail = ({
  tournament,
  twitchUsername,
  availableTeams,
  registrationState,
  isAuthenticated,
}: TournamentDetailProps) => {
  const registrationStatus = getRegistrationStatus(tournament)
  const registrationOpen = isRegistrationOpen(tournament)

  // Determine the effective Twitch channel: tournament-specific stream > global setting
  const twitchChannel = tournament.streamUrl
    ? extractTwitchChannel(tournament.streamUrl)
    : twitchUsername

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      {/* Back link */}
      <Link
        href={ROUTES.TOURNAMENTS}
        className="group inline-flex items-center gap-2 text-sm text-zinc-500 transition-colors duration-300 hover:text-white"
      >
        <span className="transition-transform duration-300 group-hover:-translate-x-0.5">
          &larr;
        </span>
        Retour aux tournois
      </Link>

      {/* Heading section: essential info */}
      <div className="relative overflow-hidden rounded-3xl border border-white/5 bg-white/2 p-6 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] backdrop-blur-xl md:p-8">
        <div className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full bg-blue-500/5 blur-3xl" />

        <div className="relative z-10 space-y-5">
          {/* Title + status badge */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <h2 className="font-paladins text-2xl tracking-wider text-white drop-shadow-[0_0_10px_rgba(59,130,246,0.3)]">
              {tournament.title}
            </h2>
            <span
              className={cn(
                'shrink-0 self-start rounded-full border px-3 py-1 text-xs font-semibold',
                registrationStatus.className,
              )}
            >
              {registrationStatus.label}
            </span>
          </div>

          {/* Info grid */}
          <div className="grid gap-3 sm:grid-cols-2">
            {tournament.game && (
              <InfoRow icon={Gamepad2} label="Jeu" value={tournament.game} />
            )}
            <InfoRow
              icon={Swords}
              label="Format"
              value={
                tournament.format === TournamentFormat.SOLO
                  ? 'Solo'
                  : `Équipe de ${tournament.teamSize}`
              }
            />
            {/* Registration / team counts — differs by format */}
            {tournament.format === TournamentFormat.SOLO ? (
              <InfoRow
                icon={Users}
                label="Inscrits"
                value={
                  tournament.maxTeams
                    ? `${tournament._count.registrations} / ${tournament.maxTeams}`
                    : `${tournament._count.registrations}`
                }
              />
            ) : (
              <>
                <InfoRow
                  icon={Users}
                  label="Joueurs"
                  value={`${tournament._count.registrations}`}
                />
                <InfoRow
                  icon={Trophy}
                  label="Équipes"
                  value={
                    tournament.maxTeams
                      ? `${tournament._count.teams} / ${tournament.maxTeams}`
                      : `${tournament._count.teams}`
                  }
                />
              </>
            )}
            <InfoRow
              icon={Calendar}
              label="Début"
              value={formatDateTime(tournament.startDate)}
            />
            <InfoRow
              icon={Calendar}
              label="Fin"
              value={formatDateTime(tournament.endDate)}
            />
          </div>
        </div>
      </div>

      {/* Prize banner (conditional) */}
      {tournament.prize && (
        <div className="relative overflow-hidden rounded-3xl border border-amber-500/20 bg-gradient-to-r from-amber-500/10 via-yellow-500/5 to-amber-500/10 p-6 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] backdrop-blur-xl md:p-8">
          <div className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full bg-amber-500/10 blur-3xl" />
          <div className="pointer-events-none absolute -left-16 -bottom-16 size-48 rounded-full bg-yellow-500/10 blur-3xl" />

          <div className="relative z-10 flex flex-col items-center gap-3 text-center">
            <div className="inline-flex rounded-full bg-amber-500/10 p-3 ring-1 ring-amber-500/20">
              <Trophy className="size-6 text-amber-400" />
            </div>
            <h3 className="font-paladins text-lg tracking-wider text-amber-300 drop-shadow-[0_0_10px_rgba(245,158,11,0.3)]">
              Récompenses
            </h3>
            <p className="max-w-lg whitespace-pre-line text-sm leading-relaxed text-amber-200/80">
              {tournament.prize}
            </p>
          </div>
        </div>
      )}

      {/* Tabbed content block */}
      <Tabs defaultValue="details" className="w-full">
        <TabsList className="w-full bg-white/5 border border-white/5 rounded-2xl p-1">
          <TabsTrigger
            value="details"
            className="flex-1 gap-1.5 rounded-xl data-[state=active]:bg-white/10 data-[state=active]:text-white text-zinc-400"
          >
            <ScrollText className="size-4" />
            Détails
          </TabsTrigger>
          <TabsTrigger
            value="stream"
            className="flex-1 gap-1.5 rounded-xl data-[state=active]:bg-white/10 data-[state=active]:text-white text-zinc-400"
          >
            <Tv className="size-4" />
            Stream
          </TabsTrigger>
          <TabsTrigger
            value="bracket"
            className="flex-1 gap-1.5 rounded-xl data-[state=active]:bg-white/10 data-[state=active]:text-white text-zinc-400"
          >
            <Swords className="size-4" />
            Bracket
          </TabsTrigger>
        </TabsList>

        {/* Tab: Détails */}
        <TabsContent value="details">
          <div className="relative overflow-hidden rounded-3xl border border-white/5 bg-white/2 p-6 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] backdrop-blur-xl md:p-8">
            <div className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full bg-blue-500/5 blur-3xl" />

            <div className="relative z-10 space-y-6">
              {/* Description */}
              {tournament.description && (
                <div className="space-y-3">
                  <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-white">
                    <ScrollText className="size-4 text-blue-400" />
                    Description
                  </h3>
                  <p className="whitespace-pre-line text-sm leading-relaxed text-zinc-400">
                    {tournament.description}
                  </p>
                </div>
              )}

              {/* Rules */}
              {tournament.rules && (
                <div className="space-y-3">
                  <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-white">
                    <ScrollText className="size-4 text-blue-400" />
                    Règlement
                  </h3>
                  <p className="whitespace-pre-line text-sm leading-relaxed text-zinc-400">
                    {tournament.rules}
                  </p>
                </div>
              )}

              {/* Dates */}
              <div className="space-y-3">
                <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-white">
                  <Calendar className="size-4 text-blue-400" />
                  Dates
                </h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  <DateRow
                    label="Début du tournoi"
                    value={formatDateTime(tournament.startDate)}
                  />
                  <DateRow
                    label="Fin du tournoi"
                    value={formatDateTime(tournament.endDate)}
                  />
                  <DateRow
                    label="Ouverture des inscriptions"
                    value={formatDateTime(tournament.registrationOpen)}
                  />
                  <DateRow
                    label="Fermeture des inscriptions"
                    value={formatDateTime(tournament.registrationClose)}
                  />
                </div>
              </div>

              {/* Fallback when no description and no rules */}
              {!tournament.description && !tournament.rules && (
                <p className="py-4 text-center text-sm text-zinc-500">
                  Aucun détail supplémentaire pour ce tournoi.
                </p>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Tab: Stream */}
        <TabsContent value="stream">
          <div className="relative overflow-hidden rounded-3xl border border-white/5 bg-white/2 p-6 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] backdrop-blur-xl md:p-8">
            <div className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full bg-blue-500/5 blur-3xl" />

            <div className="relative z-10 space-y-4">
              <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-white">
                <Video className="size-4 text-blue-400" />
                Stream en direct
              </h3>
              <TwitchPlayer channel={twitchChannel} />
            </div>
          </div>
        </TabsContent>

        {/* Tab: Bracket */}
        <TabsContent value="bracket">
          <div className="relative overflow-hidden rounded-3xl border border-white/5 bg-white/2 p-6 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] backdrop-blur-xl md:p-8">
            <div className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full bg-blue-500/5 blur-3xl" />

            <div className="relative z-10 space-y-4">
              <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-white">
                <Swords className="size-4 text-blue-400" />
                Bracket Toornament
              </h3>

              {tournament.toornamentId ? (
                <Tabs defaultValue="tournament" className="space-y-4">
                  <TabsList className="w-full flex-wrap justify-start gap-1 rounded-xl bg-white/5 p-1">
                    <TabsTrigger
                      value="tournament"
                      className="gap-1.5 rounded-lg text-xs data-[state=active]:bg-white/10 data-[state=active]:text-white"
                    >
                      <Trophy className="size-3.5" />
                      Tournoi
                    </TabsTrigger>
                    <TabsTrigger
                      value="schedule"
                      className="gap-1.5 rounded-lg text-xs data-[state=active]:bg-white/10 data-[state=active]:text-white"
                    >
                      <CalendarDays className="size-3.5" />
                      Calendrier
                    </TabsTrigger>
                    {tournament.toornamentStages.map(stage => (
                      <TabsTrigger
                        key={stage.id}
                        value={stage.stageId}
                        className="gap-1.5 rounded-lg text-xs data-[state=active]:bg-white/10 data-[state=active]:text-white"
                      >
                        <Layers className="size-3.5" />
                        {stage.name}
                      </TabsTrigger>
                    ))}
                  </TabsList>

                  {/* Tournament overview widget */}
                  <TabsContent value="tournament">
                    <div className="overflow-hidden rounded-2xl border border-white/10">
                      <iframe
                        src={`https://widget.toornament.com/tournaments/${tournament.toornamentId}/?_locale=fr&theme=dark`}
                        className="h-98 w-full border-0"
                        allow="fullscreen"
                        title="Tournoi Toornament"
                      />
                    </div>
                  </TabsContent>

                  {/* Schedule widget */}
                  <TabsContent value="schedule">
                    <div className="overflow-hidden rounded-2xl border border-white/10">
                      <iframe
                        src={`https://widget.toornament.com/tournaments/${tournament.toornamentId}/matches/schedule/?_locale=fr&theme=dark`}
                        className="h-125 w-full border-0"
                        allow="fullscreen"
                        title="Calendrier des matchs"
                      />
                    </div>
                  </TabsContent>

                  {/* Per-stage widgets */}
                  {tournament.toornamentStages.map(stage => (
                    <TabsContent key={stage.id} value={stage.stageId}>
                      <div className="overflow-hidden rounded-2xl border border-white/10">
                        <iframe
                          src={`https://widget.toornament.com/tournaments/${tournament.toornamentId}/stages/${stage.stageId}/?_locale=fr&theme=dark`}
                          className="h-125 w-full border-0"
                          allow="fullscreen"
                          title={`Bracket - ${stage.name}`}
                        />
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>
              ) : (
                <div className="flex flex-col items-center gap-3 py-8 text-center">
                  <div className="inline-flex rounded-full bg-white/5 p-4 ring-1 ring-white/10">
                    <Swords className="size-8 text-zinc-500" />
                  </div>
                  <p className="text-sm text-zinc-500">Pas encore disponible</p>
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Registration section */}
      <div className="relative overflow-hidden rounded-3xl border border-white/5 bg-white/2 p-6 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] backdrop-blur-xl md:p-8">
        <div className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full bg-blue-500/5 blur-3xl" />

        <div className="relative z-10 space-y-4">
          <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-white">
            <Clock className="size-4 text-blue-400" />
            Inscription
          </h3>

          {registrationOpen ? (
            <>
              <p className="text-center text-sm text-zinc-400">
                Les inscriptions sont ouvertes jusqu'au{' '}
                <span className="font-medium text-zinc-300">
                  {formatDate(tournament.registrationClose)}
                </span>
                .
              </p>
              <TournamentRegistrationForm
                tournamentId={tournament.id}
                fields={tournament.fields}
                format={tournament.format}
                teamSize={tournament.teamSize}
                availableTeams={availableTeams}
                tournament={tournament}
                registrationState={registrationState}
                isAuthenticated={isAuthenticated}
              />
            </>
          ) : (
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              {tournament.status === TournamentStatus.ARCHIVED ? (
                <p className="text-sm text-zinc-500">Ce tournoi est terminé.</p>
              ) : new Date() < new Date(tournament.registrationOpen) ? (
                <p className="text-sm text-zinc-500">
                  Les inscriptions ouvriront le{' '}
                  <span className="font-medium text-zinc-400">
                    {formatDate(tournament.registrationOpen)}
                  </span>
                  .
                </p>
              ) : (
                <p className="text-sm text-zinc-500">
                  Les inscriptions sont fermées depuis le{' '}
                  <span className="font-medium text-zinc-400">
                    {formatDate(tournament.registrationClose)}
                  </span>
                  .
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface InfoRowProps {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
}

const InfoRow = ({ icon: Icon, label, value }: InfoRowProps) => (
  <div className="flex items-center gap-3 rounded-2xl border border-white/5 bg-white/2 px-4 py-3">
    <Icon className="size-4 shrink-0 text-zinc-500" />
    <div className="flex min-w-0 flex-col">
      <span className="text-[10px] uppercase tracking-wider text-zinc-600">
        {label}
      </span>
      <span className="text-sm text-zinc-300">{value}</span>
    </div>
  </div>
)

interface DateRowProps {
  label: string
  value: string
}

const DateRow = ({ label, value }: DateRowProps) => (
  <div className="rounded-2xl border border-white/5 bg-white/2 px-4 py-3">
    <span className="text-[10px] uppercase tracking-wider text-zinc-600">
      {label}
    </span>
    <p className="text-sm text-zinc-300">{value}</p>
  </div>
)
