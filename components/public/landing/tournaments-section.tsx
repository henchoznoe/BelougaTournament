/**
 * File: components/public/landing/tournaments-section.tsx
 * Description: Landing page section showcasing upcoming published tournaments.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { Reveal } from '@/components/public/shared/reveal'
import { SectionHeader } from '@/components/public/shared/section-header'
import { TournamentCard } from '@/components/public/tournaments/tournament-card'
import { ROUTES } from '@/lib/config/routes'
import { getPublishedTournaments } from '@/lib/services/tournaments-public'

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
      <div className="absolute left-1/2 top-0 -z-10 h-px w-1/2 -translate-x-1/2 bg-linear-to-r from-transparent via-brand/50 to-transparent opacity-50" />

      <SectionHeader
        eyebrow="Tournois"
        title="Prochains tournois"
        description="Inscrivez-vous dès maintenant et affrontez les meilleurs joueurs de la communauté."
        className="mb-20"
      />

      {/* Tournament Cards Row */}
      <div className="mx-auto flex max-w-6xl flex-wrap justify-center gap-6">
        {displayed.map((tournament, index) => (
          <Reveal
            key={tournament.id}
            delay={index * 0.1}
            className="w-full max-w-md shrink-0 md:basis-[calc(50%-0.75rem)] lg:basis-[calc(33.333%-1rem)]"
          >
            <TournamentCard tournament={tournament} />
          </Reveal>
        ))}
      </div>

      {/* CTA Link */}
      {tournaments.length > MAX_TOURNAMENTS && (
        <div className="mt-12 text-center">
          <Link
            href={ROUTES.TOURNAMENTS}
            className="inline-flex items-center gap-2 rounded-full border border-brand/30 bg-brand/10 px-6 py-2.5 text-sm font-medium text-brand transition-colors duration-200 hover:bg-brand/20"
          >
            Voir tous les tournois
            <ArrowRight className="size-4" />
          </Link>
        </div>
      )}
    </section>
  )
}
