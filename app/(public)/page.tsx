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
import { FinalCtaSection } from '@/components/public/landing/final-cta-section'
import { HeroSection } from '@/components/public/landing/hero-section'
import { HowItWorksSection } from '@/components/public/landing/how-it-works-section'
import { SponsorsSection } from '@/components/public/landing/sponsors-section'
import { StatsSection } from '@/components/public/landing/stats-section'
import { StreamSection } from '@/components/public/landing/stream-section'
import { TournamentsSection } from '@/components/public/landing/tournaments-section'
import { TournamentsSkeleton } from '@/components/public/landing/tournaments-skeleton'
import { Skeleton } from '@/components/ui/skeleton'
import { METADATA } from '@/lib/config/constants'
import { getGlobalSettings } from '@/lib/services/settings'
import { getSponsors } from '@/lib/services/sponsors'
import { getHeroTournamentBadgeData } from '@/lib/services/tournaments-public'

export const metadata: Metadata = {
  title: 'Accueil',
  description: METADATA.DESCRIPTION,
}

/** Renders the cached hero data; auth state is resolved by the client provider. */
const HeroSectionWrapper = async () => {
  const [globalSettings, heroBadgeData] = await Promise.all([
    getGlobalSettings(),
    getHeroTournamentBadgeData(),
  ])

  return (
    <HeroSection
      twitchUrl={globalSettings.twitchUrl ?? undefined}
      badge={heroBadgeData.badge}
      badgeTournaments={heroBadgeData.tournaments}
      initialActiveTournamentSlug={null}
    />
  )
}

const LandingPage = async () => {
  const [globalSettings, sponsors] = await Promise.all([
    getGlobalSettings(),
    getSponsors(),
  ])

  return (
    <div className="flex flex-col overflow-x-hidden gap-12">
      <Suspense
        fallback={
          <Skeleton className="h-dvh w-full rounded-none bg-zinc-900/50" />
        }
      >
        <HeroSectionWrapper />
      </Suspense>
      <StatsSection />
      <FeaturesSection />
      <Suspense fallback={<TournamentsSkeleton />}>
        <TournamentsSection />
      </Suspense>
      <HowItWorksSection />
      <StreamSection channel={globalSettings.twitchUsername ?? undefined} />
      <SponsorsSection sponsors={sponsors} />
      <FinalCtaSection />
    </div>
  )
}

export default LandingPage
