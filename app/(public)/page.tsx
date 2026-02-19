/**
 * File: app/(public)/page.tsx
 * Description: Landing page with hero section and featured tournaments.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import type { Metadata } from 'next'
import { Suspense } from 'react'
import { FeaturesSection } from '@/components/features/landing/features/features'
import { HeroSection } from '@/components/features/landing/hero/hero'
import { SponsorsSection } from '@/components/features/landing/sponsors/sponsors'
import { StreamSection } from '@/components/features/landing/stream/stream'
import { TournamentsSection } from '@/components/features/tournament/list/tournaments-section'
import { TournamentsSkeleton } from '@/components/features/tournament/list/tournaments-skeleton'
import { getSiteSettings } from '@/lib/services/settings.service'

export const metadata: Metadata = {
  title: 'Accueil',
  description: 'Accueil',
}

const LandingPage = async () => {
  const [settings] = await Promise.all([getSiteSettings()])

  return (
    <div className="flex flex-col gap-24 pb-24 overflow-x-hidden">
      <HeroSection
        content={{
          HERO_BLUE_BADGE: 'Tournois',
          HERO_TITLE: 'Tournois',
          HERO_TITLE_GRADIENT: 'Tournois',
          HERO_DESCRIPTION: 'Tournois',
          HERO_DESCRIPTION_HIGHLIGHT: 'Tournois',
          HERO_PRIMARY_CTA_TEXT: 'Tournois',
          HERO_SECONDARY_CTA_TEXT: 'Tournois',
        }}
      />
      <FeaturesSection />
      <Suspense fallback={<TournamentsSkeleton />}>
        <TournamentsSection />
      </Suspense>
      <StreamSection channel={settings.socialTwitch} />
      <SponsorsSection />
    </div>
  )
}

export default LandingPage
