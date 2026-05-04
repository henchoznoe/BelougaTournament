/**
 * File: components/public/tournaments/detail/tournament-tabs.tsx
 * Description: Stream and bracket tabs for the public tournament detail view.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

'use client'

import { CalendarDays, Layers, Swords, Trophy, Tv, Video } from 'lucide-react'
import { TwitchPlayer } from '@/components/public/stream/twitch-player'
import { ContentCard } from '@/components/public/tournaments/detail/tournament-detail-shared'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { PublicTournamentDetail } from '@/lib/types/tournament'

interface TournamentTabsProps {
  tournament: Pick<PublicTournamentDetail, 'toornamentId' | 'toornamentStages'>
  twitchChannel: string | undefined
}

export const TournamentTabs = ({
  tournament,
  twitchChannel,
}: TournamentTabsProps) => (
  <Tabs defaultValue="stream" className="w-full">
    <TabsList className="w-full rounded-2xl border border-white/5 bg-white/5 p-1">
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
