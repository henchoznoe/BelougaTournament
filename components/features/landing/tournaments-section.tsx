/**
 * File: components/features/landing/tournaments-section.tsx
 * Description: Landing page section showcasing upcoming published tournaments.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { TournamentCard } from '@/components/features/tournaments/tournament-card'
import { ROUTES } from '@/lib/config/routes'
import { getPublishedTournaments } from '@/lib/services/tournaments'

/** Maximum number of tournaments to display on the landing page. */
const MAX_TOURNAMENTS = 3

export const TournamentsSection = async () => {
  const tournaments = await getPublishedTournaments()
  const displayed = tournaments.slice(0, MAX_TOURNAMENTS)

  if (displayed.length === 0) {
    return null
  }

  return (
    <section className="relative container mx-auto px-4 py-24">
      {/* Decorative Top Line */}
      <div className="absolute left-1/2 top-0 -z-10 h-px w-1/2 -translate-x-1/2 bg-linear-to-r from-transparent via-blue-500/50 to-transparent opacity-50" />

      {/* Section Header */}
      <div className="mb-20 text-center">
        <div className="mx-auto mb-6 inline-flex items-center justify-center rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1.5">
          <span className="text-sm font-semibold uppercase tracking-wider text-blue-400">
            Tournois
          </span>
        </div>

        <h2 className="font-paladins text-4xl tracking-wider text-white uppercase drop-shadow-[0_0_15px_rgba(255,255,255,0.1)] sm:text-5xl lg:text-6xl">
          Prochains tournois
        </h2>

        <p className="mx-auto mt-6 max-w-2xl text-lg text-zinc-400">
          Inscrivez-vous dès maintenant et affrontez les meilleurs joueurs de la
          communauté.
        </p>
      </div>

      {/* Tournament Cards Row */}
      <div className="mx-auto flex max-w-6xl flex-wrap justify-center gap-6">
        {displayed.map(tournament => (
          <div
            key={tournament.id}
            className="w-full max-w-md shrink-0 md:basis-[calc(50%-0.75rem)] lg:basis-[calc(33.333%-1rem)]"
          >
            <TournamentCard tournament={tournament} />
          </div>
        ))}
      </div>

      {/* CTA Link */}
      {tournaments.length > MAX_TOURNAMENTS && (
        <div className="mt-12 text-center">
          <Link
            href={ROUTES.TOURNAMENTS}
            className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-6 py-2.5 text-sm font-medium text-blue-400 transition-colors duration-200 hover:bg-blue-500/20"
          >
            Voir tous les tournois
            <ArrowRight className="size-4" />
          </Link>
        </div>
      )}
    </section>
  )
}
