/**
 * File: app/(public)/page.tsx
 * Description: Landing page with hero section and featured tournaments.
 * Author: Noé Henchoz
 * Date: 2025-12-07
 * License: MIT
 */

import type { Metadata } from 'next'
import { Suspense } from 'react'
import { Features } from '@/components/public/landing/features'
import { Hero } from '@/components/public/landing/hero'
import { Stats } from '@/components/public/landing/stats'
import { StreamSection } from '@/components/public/landing/stream-section'
import { TournamentsSection } from '@/components/public/landing/tournaments-section'
import { TournamentsSkeleton } from '@/components/public/landing/tournaments-skeleton'
import { getSiteSettings } from '@/lib/data/settings'

// Constants
const SEO_CONFIG = {
  TITLE: 'Accueil - La référence e-sport amateur',
  DESCRIPTION:
    "Rejoignez la compétition ultime. Tournois, communauté et diffusion en direct pour les passionnés d'e-sport.",
} as const

// Metadata
export const metadata: Metadata = {
  title: SEO_CONFIG.TITLE,
  description: SEO_CONFIG.DESCRIPTION,
}

export default async function LandingPage() {
  const settings = await getSiteSettings()

  const statsData = {
    years: settings.statsYears,
    players: settings.statsPlayers,
    tournaments: settings.statsTournaments,
    matches: settings.statsMatches,
  }

  return (
    <div className="flex flex-col gap-24 pb-24 overflow-x-hidden">
      <Hero />
      <Stats stats={statsData} />
      <Features />
      {/* Suspense allows the hero to load immediately while fetching tournaments */}
      <Suspense fallback={<TournamentsSkeleton />}>
        <TournamentsSection />
      </Suspense>
      <StreamSection />
    </div>
  )
}
