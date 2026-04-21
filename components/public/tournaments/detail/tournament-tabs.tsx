/**
 * File: components/public/tournaments/detail/tournament-tabs.tsx
 * Description: Tabbed content (details, stream, bracket) with registration card for the public tournament detail view.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

'use client'

import {
  Calendar,
  CalendarDays,
  Clock,
  Layers,
  ScrollText,
  Shield,
  Swords,
  Trophy,
  Tv,
  Video,
} from 'lucide-react'
import { TwitchPlayer } from '@/components/public/stream/twitch-player'
import {
  ContentCard,
  DateRow,
} from '@/components/public/tournaments/detail/tournament-detail-shared'
import { TournamentRegistrationForm } from '@/components/public/tournaments/tournament-registration-form'
import { RichText } from '@/components/ui/rich-text'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type {
  AvailableTeam,
  PublicTournamentDetail,
  UserTournamentRegistrationState,
} from '@/lib/types/tournament'
import { formatDateTime } from '@/lib/utils/formatting'
import {
  RegistrationStatus,
  TournamentStatus,
} from '@/prisma/generated/prisma/enums'

interface TournamentTabsProps {
  tournament: PublicTournamentDetail
  twitchChannel: string | undefined
  availableTeams: AvailableTeam[]
  registrationState: UserTournamentRegistrationState | null
  isAuthenticated: boolean
  registrationOpen: boolean
}

export const TournamentTabs = ({
  tournament,
  twitchChannel,
  availableTeams,
  registrationState,
  isAuthenticated,
  registrationOpen,
}: TournamentTabsProps) => (
  <Tabs defaultValue="details" className="w-full">
    <TabsList className="w-full rounded-2xl border border-white/5 bg-white/5 p-1">
      <TabsTrigger
        value="details"
        className="flex-1 gap-1.5 rounded-xl text-zinc-400 data-[state=active]:bg-white/10 data-[state=active]:text-white"
      >
        <ScrollText className="size-4" />
        Détails
      </TabsTrigger>
      <TabsTrigger
        value="stream"
        className="flex-1 gap-1.5 rounded-xl text-zinc-400 data-[state=active]:bg-white/10 data-[state=active]:text-white"
      >
        <Tv className="size-4" />
        Stream
      </TabsTrigger>
      <TabsTrigger
        value="bracket"
        className="flex-1 gap-1.5 rounded-xl text-zinc-400 data-[state=active]:bg-white/10 data-[state=active]:text-white"
      >
        <Swords className="size-4" />
        Bracket
      </TabsTrigger>
    </TabsList>

    {/* Tab: Détails */}
    <TabsContent value="details">
      <div className="space-y-6">
        {tournament.description && (
          <ContentCard icon={ScrollText} title="Description">
            <RichText content={tournament.description} />
          </ContentCard>
        )}

        {tournament.rules && (
          <ContentCard icon={Shield} title="Règlement">
            <RichText content={tournament.rules} />
          </ContentCard>
        )}

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

        {!tournament.description && !tournament.rules && (
          <div className="rounded-3xl border border-white/5 bg-white/2 p-8 text-center">
            <p className="text-sm text-zinc-500">
              Aucun détail supplémentaire pour ce tournoi.
            </p>
          </div>
        )}

        {/* Registration card */}
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
                {registrationState?.status !== RegistrationStatus.CONFIRMED && (
                  <p className="text-center text-sm text-zinc-400">
                    Les inscriptions sont ouvertes jusqu&apos;au{' '}
                    <span className="font-medium text-zinc-300">
                      {formatDateTime(tournament.registrationClose)}
                    </span>
                    .
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
)
