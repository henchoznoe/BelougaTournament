/**
 * File: app/(public)/page.tsx
 * Description: Landing page with hero section and featured tournaments.
 * Author: Noé Henchoz
 * Date: 2025-12-07
 * License: MIT
 */

// ----------------------------------------------------------------------
// IMPORTS
// ----------------------------------------------------------------------

import type { Metadata } from 'next'
import { Suspense } from 'react'
import { TournamentsSection } from '@/components/features/tournament/list/tournaments-section'
import { TournamentsSkeleton } from '@/components/features/tournament/list/tournaments-skeleton'
import { FeaturesSection } from '@/components/layout/landing/features-section'
import { HeroSection } from '@/components/layout/landing/hero-section'
import { SponsorsSection } from '@/components/layout/landing/sponsors-section'
import { StatsSection } from '@/components/layout/landing/stats-section'
import { StreamSection } from '@/components/layout/landing/stream-section'
import { getLandingStats } from '@/lib/data/mappers/landing'

// ----------------------------------------------------------------------
// CONSTANTS
// ----------------------------------------------------------------------

const CONTENT = {
  META_TITLE: 'Belouga Tournament',
  META_DESCRIPTION: 'Les tournois Belouga créés par Quentadoulive.',
  HERO: {
    HERO_BLUE_BADGE: 'La référence e-sport amateur',
    HERO_TITLE: 'BELOUGA',
    HERO_TITLE_GRADIENT: 'TOURNAMENT',
    HERO_DESCRIPTION:
      "Rejoignez la compétition ultime. Tournois, communauté et diffusion en direct pour les passionnés d'e-sport.",
    HERO_DESCRIPTION_HIGHLIGHT: 'Votre gloire commence ici.',
    HERO_PRIMARY_CTA_TEXT: 'Participer',
    HERO_SECONDARY_CTA_TEXT: 'En savoir plus',
  },
} as const

export const metadata: Metadata = {
  title: CONTENT.META_TITLE,
  description: CONTENT.META_DESCRIPTION,
}

// ----------------------------------------------------------------------
// COMPONENT
// ----------------------------------------------------------------------

const LandingPage = async () => {
  const statsData = await getLandingStats()

  return (
    <div className="flex flex-col gap-24 pb-24 overflow-x-hidden">
      <HeroSection content={CONTENT.HERO} />
      <StatsSection stats={statsData} />
      <FeaturesSection />
      <Suspense fallback={<TournamentsSkeleton />}>
        <TournamentsSection />
      </Suspense>
      <StreamSection />
      <SponsorsSection />
    </div>
  )
}

export default LandingPage
