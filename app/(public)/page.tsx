/**
 * File: app/(public)/page.tsx
 * Description: Landing page with hero section and featured tournaments.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import type { Metadata } from 'next'
import { FeaturesSection } from '@/components/features/landing/features-section'
import { HeroSection } from '@/components/features/landing/hero-section'
import { StreamSection } from '@/components/features/landing/stream-section'
import { getGlobalSettings } from '@/lib/services/settings'

export const metadata: Metadata = {
  title: 'Accueil',
  description: 'Accueil',
}

const LandingPage = async () => {
  const globalSettings = await getGlobalSettings()

  return (
    <div className="flex flex-col overflow-x-hidden gap-12">
      <HeroSection />
      <FeaturesSection />
      {/*<Suspense fallback={<TournamentsSkeleton />}>
        <TournamentsSection />
      </Suspense>*/}
      <StreamSection channel={globalSettings.twitchUsername ?? undefined} />
      {/*<SponsorsSection />*/}
    </div>
  )
}

export default LandingPage
