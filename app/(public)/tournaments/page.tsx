/**
 * File: app/(public)/tournaments/page.tsx
 * Description: Public page listing all published tournaments.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { Archive, Trophy } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'
import { TournamentCard } from '@/components/features/tournaments/tournament-card'
import { PageHeader } from '@/components/ui/page-header'
import { Skeleton } from '@/components/ui/skeleton'
import { ROUTES } from '@/lib/config/routes'
import { getPublishedTournaments } from '@/lib/services/tournaments'

export const metadata: Metadata = {
  title: 'Tournois',
  description: 'Découvrez les tournois à venir et inscrivez-vous.',
}

const TournamentsList = async () => {
  const tournaments = await getPublishedTournaments()

  if (tournaments.length === 0) {
    return (
      <div className="relative overflow-hidden rounded-3xl border border-white/5 bg-white/2 p-6 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] backdrop-blur-xl md:p-8">
        <div className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full bg-blue-500/5 blur-3xl" />
        <div className="relative z-10 flex flex-col items-center gap-4 py-8 text-center">
          <div className="flex size-16 items-center justify-center rounded-2xl border border-white/5 bg-white/5">
            <Trophy className="size-8 text-zinc-600" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-white">
              Aucun tournoi pour le moment
            </h2>
            <p className="mx-auto max-w-md text-sm text-zinc-500">
              Aucun tournoi n'est actuellement disponible. Revenez bientôt pour
              découvrir nos prochaines compétitions.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {tournaments.map(tournament => (
        <TournamentCard key={tournament.id} tournament={tournament} />
      ))}
    </div>
  )
}

const TournamentsPage = () => {
  return (
    <section className="relative px-4 pb-20 pt-32 md:pt-40">
      <PageHeader
        title="Tournois"
        description="Découvrez nos tournois à venir et inscrivez-vous pour participer."
      />

      <div className="mx-auto w-full max-w-4xl space-y-8">
        <Suspense
          fallback={
            <div className="grid gap-6 md:grid-cols-2">
              <Skeleton className="h-64 rounded-3xl border border-white/5 bg-white/2" />
              <Skeleton className="h-64 rounded-3xl border border-white/5 bg-white/2" />
            </div>
          }
        >
          <TournamentsList />
        </Suspense>

        {/* Link to archive */}
        <div className="flex justify-center">
          <Link
            href={ROUTES.TOURNAMENTS_ARCHIVE}
            className="group inline-flex items-center gap-2 rounded-full border border-white/5 bg-white/2 px-5 py-2.5 text-sm text-zinc-400 transition-all duration-300 hover:border-white/10 hover:bg-white/4 hover:text-white"
          >
            <Archive className="size-4 transition-colors duration-300 group-hover:text-blue-400" />
            Voir les tournois passés
          </Link>
        </div>
      </div>
    </section>
  )
}

export default TournamentsPage
