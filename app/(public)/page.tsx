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
import { FeaturesSection } from '@/components/features/landing/features-section'
import { HeroSection } from '@/components/features/landing/hero-section'
import { SponsorsSection } from '@/components/features/landing/sponsors-section'
import { StatsSection } from '@/components/features/landing/stats-section'
import { StreamSection } from '@/components/features/landing/stream-section'
import { fr } from '@/lib/i18n/dictionaries/fr'
import {
  getLandingStats,
  getSiteSettings,
} from '@/lib/services/settings.service'

export const metadata: Metadata = {
  title: fr.pages.home.metaTitle,
  description: fr.pages.home.metaDescription,
}

// ----------------------------------------------------------------------
// COMPONENT
// ----------------------------------------------------------------------

const LandingPage = async () => {
  const [statsData, settings] = await Promise.all([
    getLandingStats(),
    getSiteSettings(),
  ])

  return (
    <div className="flex flex-col gap-24 pb-24 overflow-x-hidden">
      <HeroSection
        content={{
          HERO_BLUE_BADGE: fr.pages.home.hero.badge,
          HERO_TITLE: fr.pages.home.hero.title,
          HERO_TITLE_GRADIENT: fr.pages.home.hero.titleGradient,
          HERO_DESCRIPTION: fr.pages.home.hero.description,
          HERO_DESCRIPTION_HIGHLIGHT: fr.pages.home.hero.descriptionHighlight,
          HERO_PRIMARY_CTA_TEXT: fr.pages.home.hero.primaryCta,
          HERO_SECONDARY_CTA_TEXT: fr.pages.home.hero.secondaryCta,
        }}
      />
      <StatsSection stats={statsData} />
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
