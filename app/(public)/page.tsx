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
import { Skeleton } from '@/components/ui/skeleton'
import { METADATA } from '@/lib/config/constants'
import { getSession } from '@/lib/services/auth'
import { getGlobalSettings } from '@/lib/services/settings'
import { getSponsors } from '@/lib/services/sponsors'
import { getHeroTournamentBadgeData } from '@/lib/services/tournaments-public'
import { resolveActiveTournamentSlug } from '@/lib/utils/hero-tournament-badge'

export const metadata: Metadata = {
  title: 'Accueil',
  description: METADATA.DESCRIPTION,
}

/** Fetches the session (dynamic) and renders HeroSection with auth state. */
const HeroSectionWrapper = async () => {
  const [globalSettings, heroBadgeData, session] = await Promise.all([
    getGlobalSettings(),
    getHeroTournamentBadgeData(),
    getSession(),
  ])

  return (
    <HeroSection
      twitchUrl={globalSettings.twitchUrl ?? undefined}
      badge={heroBadgeData.badge}
      badgeTournaments={heroBadgeData.tournaments}
      initialActiveTournamentSlug={resolveActiveTournamentSlug(
        heroBadgeData.tournaments,
      )}
      isAuthenticated={!!session?.user}
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
