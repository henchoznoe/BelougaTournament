/**
 * File: app/(public)/tournaments/[slug]/page.tsx
 * Description: Public tournament detail page.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import {
  Calendar,
  ChevronRight,
  Info,
  Swords,
  Trophy,
  Users,
  Video,
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { RegistrationForm } from '@/components/features/registration/registration-form'
import { TwitchEmbed } from '@/components/features/stream/twitch-embed'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { APP_ROUTES } from '@/lib/config/routes'
import { getSiteSettings } from '@/lib/services/settings.service'
import { getTournamentBySlug } from '@/lib/services/tournament.service'
import { formatDateTime } from '@/lib/utils'

const CONFIG = {
  // TODO: Will be replace by challonge
  CHALLONGE_URL: 'https://challonge.com',
} as const

export const generateMetadata = async ({
  params,
}: {
  params: Promise<{ slug: string }>
}) => {
  const { slug } = await params
  const tournament = await getTournamentBySlug(slug)

  if (!tournament) {
    return {
      title: 'Tournoi introuvable',
    }
  }

  return {
    title: tournament.title,
    description: tournament.description,
  }
}

const TournamentPage = async ({
  params,
}: {
  params: Promise<{ slug: string }>
}) => {
  const { slug } = await params
  const tournament = await getTournamentBySlug(slug)
  const settings = await getSiteSettings()

  if (!tournament) {
    notFound()
  }

  const now = new Date()
  const registrationOpen = new Date(tournament.registrationOpen)
  const registrationClose = new Date(tournament.registrationClose)
  const isRegistrationOpen = now >= registrationOpen && now <= registrationClose

  return (
    <div className="relative min-h-screen pb-24">
      {/* Background Elements */}
      <div className="absolute inset-0 z-0">
        <Image
          alt="Background"
          className="object-cover opacity-20 grayscale"
          fill
          priority
          src="/assets/wall.png"
        />
        <div className="absolute inset-0 bg-zinc-950/80" />
        <div className="absolute inset-0 bg-linear-to-b from-zinc-950/50 via-transparent to-zinc-950" />
      </div>

      <div className="relative z-10 container mx-auto max-w-6xl px-4 py-12">
        {/* Back Button */}
        <Button
          asChild
          variant="ghost"
          className="mb-8 text-zinc-400 hover:bg-white/5 hover:text-white pl-0 hover:pl-4 transition-all"
        >
          <Link href={APP_ROUTES.TOURNAMENTS}>
            <ChevronRight className="mr-2 size-4 rotate-180" />
            Retour
          </Link>
        </Button>

        {/* Header Section */}
        <div className="mb-12 space-y-6 animate-in fade-in slide-in-from-top-8 duration-700">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full bg-blue-500/10 px-3 py-1 text-sm font-medium text-blue-400 ring-1 ring-blue-500/20">
                <Trophy className="size-4" />
                <span>Format {tournament.format}</span>
              </div>
              <h1 className="font-paladins text-4xl md:text-6xl text-white tracking-wider drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]">
                {tournament.title}
              </h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-zinc-400 border-t border-white/10 pt-6">
            <div className="flex items-center gap-2">
              <Calendar className="size-5 text-blue-500" />
              <span className="font-medium text-zinc-300">
                {formatDateTime(tournament.startDate)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="size-5 text-green-500" />
              <span className="font-medium text-zinc-300">
                {tournament.maxParticipants
                  ? `Max ${tournament.maxParticipants} ${
                      tournament.format === 'TEAM' ? 'equipes' : 'joueurs'
                    }`
                  : 'Illimité'}
              </span>
            </div>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8 animate-in fade-in slide-in-from-left-8 duration-700 delay-150">
            <Tabs defaultValue="details" className="w-full">
              <TabsList className="w-full justify-start bg-zinc-900/50 border border-zinc-800 p-1 h-auto flex-wrap">
                <TabsTrigger
                  value="details"
                  className="flex-1 min-w-[100px] text-zinc-400 data-[state=active]:bg-blue-600 data-[state=active]:text-white hover:text-white transition-colors"
                >
                  <Info className="mr-2 size-4" /> Détails
                </TabsTrigger>
                <TabsTrigger
                  value="bracket"
                  className="flex-1 min-w-[100px] text-zinc-400 data-[state=active]:bg-blue-600 data-[state=active]:text-white hover:text-white transition-colors"
                >
                  <Trophy className="mr-2 size-4" /> Bracket
                </TabsTrigger>
                <TabsTrigger
                  value="stream"
                  className="flex-1 min-w-[100px] text-zinc-400 data-[state=active]:bg-blue-600 data-[state=active]:text-white hover:text-white transition-colors"
                >
                  <Video className="mr-2 size-4" /> Stream
                </TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="mt-6 space-y-6">
                <div className="rounded-2xl border border-white/10 bg-zinc-900/50 p-8 backdrop-blur-sm">
                  <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                    <Info className="size-6 text-blue-400" />A propos
                  </h3>
                  <div className="prose prose-invert max-w-none text-zinc-300 leading-relaxed">
                    <p className="whitespace-pre-wrap">
                      {tournament.description}
                    </p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="bracket" className="mt-6">
                {tournament.challongeId ? (
                  <div className="rounded-2xl border border-white/10 bg-zinc-900/50 p-1 backdrop-blur-sm overflow-hidden">
                    <div className="aspect-video w-full bg-zinc-950">
                      <iframe
                        src={`${CONFIG.CHALLONGE_URL}/${tournament.challongeId}/module`}
                        width="100%"
                        height="100%"
                        frameBorder="0"
                        scrolling="auto"
                        allowTransparency
                        title="Bracket"
                      ></iframe>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-zinc-900/50 p-12 text-center backdrop-blur-sm">
                    <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-zinc-800/50">
                      <Trophy className="size-8 text-zinc-600" />
                    </div>
                    <h3 className="text-xl font-bold text-white">Bracket</h3>
                    <p className="mt-2 text-zinc-400">Bracket non disponible</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="stream" className="mt-6">
                {settings.socialTwitch ? (
                  <div className="rounded-2xl border border-white/10 bg-zinc-900/50 p-1 backdrop-blur-sm overflow-hidden">
                    <div className="aspect-video w-full bg-zinc-950">
                      <TwitchEmbed channel={settings.socialTwitch} />
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-zinc-900/50 p-12 text-center backdrop-blur-sm">
                    <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-zinc-800/50">
                      <Video className="size-8 text-zinc-600" />
                    </div>
                    <h3 className="text-xl font-bold text-white">
                      Stream non disponible
                    </h3>
                    <p className="mt-2 text-zinc-400">Stream non disponible</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar Registration */}
          <div className="lg:col-span-1 animate-in fade-in slide-in-from-right-8 duration-700 delay-300">
            <div className="sticky top-24 space-y-6">
              <div className="rounded-2xl border border-white/10 bg-zinc-900/80 p-6 backdrop-blur-xl shadow-2xl">
                <h3 className="mb-6 text-xl font-bold text-white flex items-center gap-2">
                  <Users className="size-5 text-blue-400" /> Inscription
                </h3>

                {isRegistrationOpen ? (
                  <div className="space-y-6">
                    <div className="rounded-lg bg-orange-500/10 p-4 border border-orange-500/20">
                      <p className="text-sm text-white text-center">
                        Inscription
                        <span className="font-bold text-white">
                          {formatDateTime(tournament.registrationClose)}
                        </span>
                      </p>
                    </div>

                    <RegistrationForm tournament={tournament} />
                  </div>
                ) : (
                  <div className="rounded-lg bg-red-500/10 p-6 text-center border border-red-500/20">
                    <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-red-500/20">
                      <Swords className="size-6 text-red-400" />
                    </div>
                    <p className="font-bold text-red-400 mb-2">
                      Inscription fermée
                    </p>
                    <p className="text-sm text-zinc-400">
                      {now < registrationOpen
                        ? "Ouverture de l'inscription le " +
                          formatDateTime(tournament.registrationOpen)
                        : 'Inscription fermée le ' +
                          formatDateTime(tournament.registrationClose)}
                    </p>
                  </div>
                )}
              </div>

              {/* Help Card */}
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 backdrop-blur-sm">
                <h4 className="font-semibold text-white mb-2">Aide</h4>
                <p className="text-sm text-zinc-400 mb-4">
                  Si vous avez des questions, n'hésitez pas à nous contacter sur
                  Discord.
                </p>
                <Button
                  asChild
                  className="w-full bg-[#5865F2] hover:bg-[#4752C4] text-white transition-colors"
                >
                  <Link
                    href={settings.socialDiscord ?? '#'}
                    target={settings.socialDiscord ? '_blank' : undefined}
                  >
                    Rejoindre le serveur Discord
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TournamentPage
