/**
 * File: components/public/tournaments/tournament-detail.tsx
 * Description: Client component displaying full tournament detail with hero banner, markdown content, and tabs.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

'use client'

import {
  Calendar,
  CalendarDays,
  ChevronLeft,
  Clock,
  Coins,
  Gamepad2,
  Layers,
  ScrollText,
  Shield,
  Swords,
  Trophy,
  Tv,
  Users,
  Video,
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { TwitchPlayer } from '@/components/public/stream/twitch-player'
import { TournamentRegistrationForm } from '@/components/public/tournaments/tournament-registration-form'
import { RichText } from '@/components/ui/rich-text'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ROUTES } from '@/lib/config/routes'
import type {
  AvailableTeam,
  PublicTournamentDetail,
  UserTournamentRegistrationState,
} from '@/lib/types/tournament'
import { cn } from '@/lib/utils/cn'
import {
  formatCentimes,
  formatDate,
  formatDateTime,
  pluralize,
  stripHtml,
} from '@/lib/utils/formatting'
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
      dotClassName: 'bg-zinc-400',
    }
  }
  if (now < open) {
    return {
      label: 'Inscriptions bientôt',
      className: 'border-amber-500/30 bg-amber-500/10 text-amber-400',
      dotClassName: 'bg-amber-400',
    }
  }
  if (now >= open && now <= close) {
    return {
      label: 'Inscriptions ouvertes',
      className: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
      dotClassName: 'bg-emerald-400 animate-pulse',
    }
  }
  return {
    label: 'Inscriptions fermées',
    className: 'border-red-500/30 bg-red-500/10 text-red-400',
    dotClassName: 'bg-red-400',
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
    if (url.hostname.includes('twitch.tv')) {
      const parts = url.pathname.split('/').filter(Boolean)
      return parts[0] ?? streamUrl
    }
    return streamUrl
  } catch {
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
  const [activeImageIndex, setActiveImageIndex] = useState(0)

  const twitchChannel = tournament.streamUrl
    ? extractTwitchChannel(tournament.streamUrl)
    : twitchUsername

  const entryFee =
    tournament.entryFeeAmount && tournament.entryFeeCurrency
      ? formatCentimes(tournament.entryFeeAmount, tournament.entryFeeCurrency)
      : null

  return (
    <div className="mx-auto w-full max-w-4xl space-y-8">
      {/* Back link */}
      <Link
        href={ROUTES.TOURNAMENTS}
        className="group inline-flex items-center gap-2 text-sm text-zinc-500 transition-colors duration-300 hover:text-white"
      >
        <ChevronLeft className="size-4 transition-transform duration-300 group-hover:-translate-x-0.5" />
        Retour aux tournois
      </Link>

      {/* ===== HERO SECTION ===== */}
      <div className="relative overflow-hidden rounded-3xl border border-white/5">
        {/* Background image or gradient */}
        {tournament.imageUrls.length > 0 ? (
          <div className="relative h-56 sm:h-72 md:h-80">
            <Image
              src={tournament.imageUrls[activeImageIndex]}
              alt={tournament.title}
              fill
              className="object-cover"
              priority
            />
            {/* Dark overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/70 to-zinc-950/20" />
            <div className="absolute inset-0 bg-gradient-to-r from-zinc-950/50 to-transparent" />
          </div>
        ) : (
          <div className="relative h-44 sm:h-56 bg-gradient-to-br from-blue-600/20 via-zinc-950 to-purple-600/10">
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 to-transparent" />
          </div>
        )}

        {/* Hero content overlay */}
        <div className="relative z-10 -mt-28 sm:-mt-32 px-6 pb-6 md:px-8 md:pb-8">
          {/* Status badge */}
          <div className="mb-4 flex items-center gap-3">
            <span
              className={cn(
                'inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold',
                registrationStatus.className,
              )}
            >
              <span
                className={cn(
                  'size-1.5 rounded-full',
                  registrationStatus.dotClassName,
                )}
              />
              {registrationStatus.label}
            </span>
            {tournament.games.length > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/5 bg-white/5 px-3 py-1.5 text-xs font-medium text-zinc-300">
                <Gamepad2 className="size-3" />
                {tournament.games.join(', ')}
              </span>
            )}
          </div>

          {/* Title */}
          <h1 className="mb-2 font-paladins text-3xl tracking-wider text-white drop-shadow-[0_0_20px_rgba(59,130,246,0.4)] sm:text-4xl md:text-5xl">
            {tournament.title}
          </h1>

          {/* Quick info row */}
          <div className="mt-4 flex flex-wrap gap-3">
            <QuickBadge
              icon={Swords}
              text={
                tournament.format === TournamentFormat.SOLO
                  ? 'Solo'
                  : `Équipe de ${tournament.teamSize}`
              }
            />
            <QuickBadge
              icon={Calendar}
              text={formatDate(tournament.startDate)}
            />
            {tournament.format === TournamentFormat.SOLO ? (
              <QuickBadge
                icon={Users}
                text={
                  tournament.maxTeams
                    ? `${tournament._count.registrations}/${tournament.maxTeams} inscrits`
                    : `${tournament._count.registrations} inscrit${pluralize(tournament._count.registrations)}`
                }
              />
            ) : (
              <>
                <QuickBadge
                  icon={Users}
                  text={
                    tournament.maxTeams
                      ? `${tournament._count.teams}/${tournament.maxTeams} équipes`
                      : `${tournament._count.teams} équipe${pluralize(tournament._count.teams)}`
                  }
                />
                <QuickBadge
                  icon={Users}
                  text={`${tournament._count.registrations} joueur${pluralize(tournament._count.registrations)}`}
                />
              </>
            )}
            {entryFee && <QuickBadge icon={Coins} text={entryFee} />}
          </div>
        </div>
      </div>

      {/* ===== IMAGE GALLERY THUMBNAILS ===== */}
      {tournament.imageUrls.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {tournament.imageUrls.map((url, index) => (
            <button
              key={url}
              type="button"
              onClick={() => setActiveImageIndex(index)}
              className={cn(
                'relative size-16 shrink-0 overflow-hidden rounded-xl border-2 transition-all duration-200',
                index === activeImageIndex
                  ? 'border-blue-500 ring-1 ring-blue-500/30'
                  : 'border-white/10 opacity-60 hover:opacity-100',
              )}
            >
              <Image
                src={url}
                alt={`${tournament.title} ${index + 1}`}
                fill
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {/* ===== STATS GRID ===== */}
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
        <StatCard
          icon={Clock}
          label="Fin"
          value={formatDate(tournament.endDate)}
        />
      </div>

      {/* ===== PRIZE BANNER ===== */}
      {tournament.prize && stripHtml(tournament.prize).trim() && (
        <div className="relative overflow-hidden rounded-3xl border border-amber-500/20 bg-gradient-to-r from-amber-500/10 via-yellow-500/5 to-amber-500/10 p-6 md:p-8">
          <div className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full bg-amber-500/10 blur-3xl" />
          <div className="pointer-events-none absolute -left-16 -bottom-16 size-48 rounded-full bg-yellow-500/10 blur-3xl" />

          <div className="relative z-10 flex flex-col items-center gap-3 text-center">
            <div className="inline-flex rounded-full bg-amber-500/10 p-3 ring-1 ring-amber-500/20">
              <Trophy className="size-6 text-amber-400" />
            </div>
            <h3 className="font-paladins text-lg tracking-wider text-amber-300 drop-shadow-[0_0_10px_rgba(245,158,11,0.3)]">
              Récompenses
            </h3>
            <RichText
              content={tournament.prize}
              className="prose-p:text-amber-200/80 prose-strong:text-amber-200"
            />
          </div>
        </div>
      )}

      {/* ===== TABBED CONTENT ===== */}
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
          <div className="space-y-6">
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

            {/* Dates detail */}
            <ContentCard icon={Calendar} title="Dates">
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
            </ContentCard>

            {/* Fallback */}
            {!tournament.description && !tournament.rules && (
              <div className="rounded-3xl border border-white/5 bg-white/2 p-8 text-center">
                <p className="text-sm text-zinc-500">
                  Aucun détail supplémentaire pour ce tournoi.
                </p>
              </div>
            )}

            {/* Registration */}
            <div className="relative overflow-hidden rounded-3xl border border-blue-500/20 bg-gradient-to-br from-blue-500/5 via-white/2 to-purple-500/5 p-6 shadow-[0_0_40px_rgba(59,130,246,0.08)] md:p-8">
              <div className="pointer-events-none absolute -right-20 -top-20 size-56 rounded-full bg-blue-500/10 blur-3xl" />
              <div className="pointer-events-none absolute -left-20 -bottom-20 size-56 rounded-full bg-purple-500/10 blur-3xl" />

              <div className="relative z-10 space-y-4">
                <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-white">
                  <Clock className="size-4 text-blue-400" />
                  Inscription
                </h3>

                {registrationOpen ? (
                  <>
                    <p className="text-center text-sm text-zinc-400">
                      Les inscriptions sont ouvertes jusqu&apos;au{' '}
                      <span className="font-medium text-zinc-300">
                        {formatDateTime(tournament.registrationClose)}
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
                      <p className="text-sm text-zinc-500">
                        Ce tournoi est terminé.
                      </p>
                    ) : new Date() < new Date(tournament.registrationOpen) ? (
                      <p className="text-sm text-zinc-500">
                        Les inscriptions ouvriront le{' '}
                        <span className="font-medium text-zinc-400">
                          {formatDateTime(tournament.registrationOpen)}
                        </span>
                        .
                      </p>
                    ) : (
                      <p className="text-sm text-zinc-500">
                        Les inscriptions sont fermées depuis le{' '}
                        <span className="font-medium text-zinc-400">
                          {formatDateTime(tournament.registrationClose)}
                        </span>
                        .
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Tab: Stream */}
        <TabsContent value="stream">
          <ContentCard icon={Video} title="Stream en direct">
            <TwitchPlayer channel={twitchChannel} />
          </ContentCard>
        </TabsContent>

        {/* Tab: Bracket */}
        <TabsContent value="bracket">
          <ContentCard icon={Swords} title="Bracket Toornament">
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
          </ContentCard>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface QuickBadgeProps {
  icon: React.ComponentType<{ className?: string }>
  text: string
}

const QuickBadge = ({ icon: Icon, text }: QuickBadgeProps) => (
  <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-zinc-300 backdrop-blur-sm">
    <Icon className="size-3 text-zinc-500" />
    {text}
  </span>
)

interface StatCardProps {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
}

const StatCard = ({ icon: Icon, label, value }: StatCardProps) => (
  <div className="group relative overflow-hidden rounded-2xl border border-white/5 bg-white/2 p-4 transition-colors duration-300 hover:border-white/10 hover:bg-white/4">
    <div className="pointer-events-none absolute -right-4 -top-4 size-16 rounded-full bg-blue-500/5 blur-2xl transition-all duration-300 group-hover:bg-blue-500/10" />
    <div className="relative z-10">
      <Icon className="mb-2 size-4 text-blue-400" />
      <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-600">
        {label}
      </p>
      <p className="text-sm font-semibold text-white">{value}</p>
    </div>
  </div>
)

interface ContentCardProps {
  icon: React.ComponentType<{ className?: string }>
  title: string
  children: React.ReactNode
}

const ContentCard = ({ icon: Icon, title, children }: ContentCardProps) => (
  <div className="relative overflow-hidden rounded-3xl border border-white/5 bg-white/2 p-6 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] backdrop-blur-xl md:p-8">
    <div className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full bg-blue-500/5 blur-3xl" />
    <div className="relative z-10 space-y-4">
      <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-white">
        <Icon className="size-4 text-blue-400" />
        {title}
      </h3>
      {children}
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
