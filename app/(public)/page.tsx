/**
 * File: app/(public)/page.tsx
 * Description: Landing page with hero section and featured tournaments.
 * Author: Noé Henchoz
 * Date: 2025-12-07
 * License: MIT
 */

import type { Metadata } from 'next'
import { Suspense } from 'react'
import { TournamentsSection } from '@/components/features/tournament/list/tournaments-section'
import { TournamentsSkeleton } from '@/components/features/tournament/list/tournaments-skeleton'
import { FeaturesSection } from '@/components/layout/landing/features-section'
import { HeroSection } from '@/components/layout/landing/hero-section'
import { StatsSection } from '@/components/layout/landing/stats-section'
import { StreamSection } from '@/components/layout/landing/stream-section'
import { HOME_CONFIG } from '@/lib/constants'
import { getSiteSettings } from '@/lib/data/settings'

// Metadata
export const metadata: Metadata = {
  title: HOME_CONFIG.META_TITLE,
  description: HOME_CONFIG.META_DESCRIPTION,
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
      <HeroSection />
      <StatsSection stats={statsData} />
      <FeaturesSection />
      <Suspense fallback={<TournamentsSkeleton />}>
        <TournamentsSection />
      </Suspense>
      <StreamSection />
    </div>
  )
}
