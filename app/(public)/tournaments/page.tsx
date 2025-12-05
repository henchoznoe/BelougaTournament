/**
 * File: app/(public)/tournaments/page.tsx
 * Description: Public page listing all upcoming tournaments with premium aesthetic.
 * Author: Noé Henchoz
 * Date: 2025-12-04
 * License: MIT
 */

import {
  Archive,
  Calendar,
  ChevronRight,
  Gamepad2,
  Trophy,
  Users,
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { getPublicTournaments } from '@/lib/data/tournaments'

export default async function TournamentsPage() {
  const tournaments = await getPublicTournaments()

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

      <div className="relative z-10 container mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-12 flex flex-col items-center text-center space-y-4 animate-in fade-in slide-in-from-top-8 duration-700">
          <div className="inline-flex items-center justify-center p-3 rounded-full bg-blue-500/10 ring-1 ring-blue-500/20 mb-4">
            <Trophy className="size-8 text-blue-400" />
          </div>
          <h1 className="font-paladins text-4xl md:text-6xl text-white tracking-wider drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]">
            Tous les Tournois
          </h1>
          <p className="max-w-2xl text-lg text-zinc-400">
            Découvrez les prochaines compétitions, inscrivez-vous et
            préparez-vous à affronter les meilleurs joueurs.
          </p>

          <div className="pt-4">
            <Button
              asChild
              variant="outline"
              className="border-zinc-700 bg-zinc-900/50 text-zinc-300 hover:bg-zinc-800 hover:text-white hover:border-zinc-600 transition-all"
            >
              <Link href="/tournaments/archive">
                <Archive className="mr-2 size-4" />
                Voir les archives
              </Link>
            </Button>
          </div>
        </div>

        {/* Grid */}
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {tournaments.length > 0 ? (
            tournaments.map((tournament, index) => (
              <div
                key={tournament.id}
                className="animate-in fade-in slide-in-from-bottom-8 duration-700 fill-mode-backwards"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <Card className="group h-full border-zinc-800 bg-zinc-900/50 backdrop-blur-sm transition-all hover:border-blue-500/50 hover:shadow-[0_0_30px_-10px_rgba(37,99,235,0.3)] hover:-translate-y-1">
                  <CardHeader>
                    <div className="mb-4 flex items-center justify-between">
                      <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-400 ring-1 ring-blue-500/20">
                        {tournament.format}
                      </span>
                      <span className="text-xs text-zinc-500 font-mono">
                        ID: {tournament.slug.slice(0, 8)}
                      </span>
                    </div>
                    <CardTitle className="text-2xl text-white group-hover:text-blue-400 transition-colors">
                      {tournament.title}
                    </CardTitle>
                    <CardDescription className="line-clamp-2 text-zinc-400 mt-2">
                      {tournament.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4 text-sm text-zinc-300">
                    <div className="flex items-center gap-3">
                      <div className="flex size-8 items-center justify-center rounded-lg bg-zinc-800/50 group-hover:bg-blue-500/10 transition-colors">
                        <Calendar className="size-4 text-blue-500" />
                      </div>
                      <span className="font-medium">
                        {new Date(tournament.startDate).toLocaleDateString(
                          'fr-FR',
                          {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'long',
                          },
                        )}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex size-8 items-center justify-center rounded-lg bg-zinc-800/50 group-hover:bg-green-500/10 transition-colors">
                        <Users className="size-4 text-green-500" />
                      </div>
                      <span>
                        {tournament.maxParticipants
                          ? `${tournament._count.registrations} / ${tournament.maxParticipants} ${
                              tournament.format === 'TEAM'
                                ? 'Équipes'
                                : 'Joueurs'
                            }`
                          : `${tournament._count.registrations} Inscrit${
                              tournament._count.registrations > 1 ? 's' : ''
                            }`}
                      </span>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button
                      asChild
                      className="w-full bg-zinc-800 font-semibold text-white hover:bg-blue-600 transition-all duration-300"
                    >
                      <Link href={`/tournaments/${tournament.slug}`}>
                        Voir les détails
                        <ChevronRight className="ml-2 size-4" />
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            ))
          ) : (
            <div className="col-span-full py-24 text-center animate-in fade-in zoom-in-95 duration-500">
              <div className="mx-auto mb-6 flex size-20 items-center justify-center rounded-full bg-zinc-900/50 ring-1 ring-zinc-800">
                <Gamepad2 className="size-10 text-zinc-600" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">
                Aucun tournoi prévu
              </h3>
              <p className="text-zinc-500">
                Revenez plus tard pour découvrir les prochaines compétitions !
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
