/**
 * File: app/(public)/tournaments/[slug]/page.tsx
 * Description: Public tournament detail page with premium aesthetic and French localization.
 * Author: Noé Henchoz
 * Date: 2025-12-04
 * License: MIT
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
import { RegistrationForm } from '@/components/tournament/registration-form'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { getTournamentBySlug } from '@/lib/data/tournaments'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const tournament = await getTournamentBySlug(slug)

  if (!tournament) {
    return {
      title: 'Tournoi introuvable',
    }
  }

  return {
    title: `Rejoignez ${tournament.title} | Belouga Tournament`,
    description: tournament.description,
  }
}

export default async function TournamentPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const tournament = await getTournamentBySlug(slug)

  if (!tournament) {
    notFound()
  }

  const now = new Date()
  const isRegistrationOpen =
    now >= tournament.registrationOpen && now <= tournament.registrationClose

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
          <Link href="/tournaments">
            <ChevronRight className="mr-2 size-4 rotate-180" />
            Retour aux tournois
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
                {new Date(tournament.startDate).toLocaleDateString('fr-FR', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                })}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="size-5 text-green-500" />
              <span className="font-medium text-zinc-300">
                {tournament.maxParticipants
                  ? `Max ${tournament.maxParticipants} ${tournament.format === 'TEAM' ? 'Équipes' : 'Joueurs'}`
                  : 'Places illimitées'}
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
                  <Video className="mr-2 size-4" /> Live
                </TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="mt-6 space-y-6">
                <div className="rounded-2xl border border-white/10 bg-zinc-900/50 p-8 backdrop-blur-sm">
                  <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                    <Info className="size-6 text-blue-400" />À propos du tournoi
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
                        src={`https://challonge.com/${tournament.challongeId}/module`}
                        width="100%"
                        height="100%"
                        frameBorder="0"
                        scrolling="auto"
                        allowTransparency
                        title="Arbre du tournoi"
                      ></iframe>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-zinc-900/50 p-12 text-center backdrop-blur-sm">
                    <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-zinc-800/50">
                      <Trophy className="size-8 text-zinc-600" />
                    </div>
                    <h3 className="text-xl font-bold text-white">
                      Arbre non disponible
                    </h3>
                    <p className="mt-2 text-zinc-400">
                      L'arbre du tournoi n'a pas encore été publié.
                    </p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="stream" className="mt-6">
                {tournament.streamUrl ? (
                  <div className="rounded-2xl border border-white/10 bg-zinc-900/50 p-1 backdrop-blur-sm overflow-hidden">
                    <div className="aspect-video w-full bg-zinc-950">
                      <iframe
                        src={tournament.streamUrl}
                        width="100%"
                        height="100%"
                        allowFullScreen
                        title="Stream en direct"
                        className="w-full h-full"
                      ></iframe>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-zinc-900/50 p-12 text-center backdrop-blur-sm">
                    <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-zinc-800/50">
                      <Video className="size-8 text-zinc-600" />
                    </div>
                    <h3 className="text-xl font-bold text-white">
                      Stream hors ligne
                    </h3>
                    <p className="mt-2 text-zinc-400">
                      Aucun stream n'est configuré pour ce tournoi pour le
                      moment.
                    </p>
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
                  <Users className="size-5 text-blue-400" />
                  Inscription
                </h3>

                {isRegistrationOpen ? (
                  <div className="space-y-6">
                    <div className="rounded-lg bg-blue-500/10 p-4 border border-blue-500/20">
                      <p className="text-sm text-blue-200 text-center">
                        Les inscriptions ferment le{' '}
                        <span className="font-bold text-white">
                          {new Date(
                            tournament.registrationClose,
                          ).toLocaleDateString('fr-FR')}
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
                      Inscriptions fermées
                    </p>
                    <p className="text-sm text-zinc-400">
                      {now < tournament.registrationOpen
                        ? `Ouverture le ${new Date(tournament.registrationOpen).toLocaleDateString('fr-FR')}`
                        : "La période d'inscription est terminée."}
                    </p>
                  </div>
                )}
              </div>

              {/* Help Card */}
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 backdrop-blur-sm">
                <h4 className="font-semibold text-white mb-2">
                  Besoin d'aide ?
                </h4>
                <p className="text-sm text-zinc-400 mb-4">
                  Rejoignez notre Discord pour contacter les administrateurs du
                  tournoi.
                </p>
                <Button className="w-full bg-[#5865F2] hover:bg-[#4752C4] text-white transition-colors">
                  Rejoindre le Discord
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
