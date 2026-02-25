/**
 * File: app/(public)/page.tsx
 * Description: Landing page with hero section and featured tournaments.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import type { Metadata } from 'next'
import HeroSection from '@/components/features/landing/hero-section'

export const metadata: Metadata = {
  title: 'Accueil',
  description: 'Accueil',
}

const LandingPage = async () => {
  return (
    <div className="flex flex-col overflow-x-hidden">
      <HeroSection />
      {/*<FeaturesSection />
      <Suspense fallback={<TournamentsSkeleton />}>
        <TournamentsSection />
      </Suspense>
      <StreamSection channel={settings.socialTwitch} />
      <SponsorsSection />*/}
    </div>
  )
}

export default LandingPage
