/**
 * File: app/(public)/page.tsx
 * Description: Landing page with hero section and featured tournaments.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import type { Metadata } from 'next'
import { Suspense } from 'react'
import { FeaturesSection } from '@/components/public/landing/features-section'
import { HeroSection } from '@/components/public/landing/hero-section'
import { SponsorsSection } from '@/components/public/landing/sponsors-section'
import { StreamSection } from '@/components/public/landing/stream-section'
import { TournamentsSection } from '@/components/public/landing/tournaments-section'
import { TournamentsSkeleton } from '@/components/public/landing/tournaments-skeleton'
import { getGlobalSettings } from '@/lib/services/settings'
import { getSponsors } from '@/lib/services/sponsors'
import { getHeroTournamentBadgeData } from '@/lib/services/tournaments'

export const metadata: Metadata = {
  title: 'Accueil',
  description: 'Accueil',
}

const LandingPage = async () => {
  const [globalSettings, sponsors, heroBadgeData] = await Promise.all([
    getGlobalSettings(),
    getSponsors(),
    getHeroTournamentBadgeData(),
  ])

  return (
    <div className="flex flex-col overflow-x-hidden gap-12">
      <HeroSection
        twitchUrl={globalSettings.twitchUrl ?? undefined}
        badge={heroBadgeData.badge}
        badgeTournaments={heroBadgeData.tournaments}
      />
      <FeaturesSection />
      <Suspense fallback={<TournamentsSkeleton />}>
        <TournamentsSection />
      </Suspense>
      <StreamSection channel={globalSettings.twitchUsername ?? undefined} />
      <SponsorsSection sponsors={sponsors} />
    </div>
  )
}

export default LandingPage
