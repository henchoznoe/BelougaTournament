/**
 * File: app/(public)/page.tsx
 * Description: Landing page with hero section and featured tournaments.
 * Author: Noé Henchoz
 * Date: 2025-12-02
 * License: MIT
 */

import { Suspense } from 'react'
import { Features } from '@/components/public/landing/features'
import { Hero } from '@/components/public/landing/hero'
import { Stats } from '@/components/public/landing/stats'
import { StreamSection } from '@/components/public/landing/stream-section'
import { TournamentsSection } from '@/components/public/landing/tournaments-section'
import { TournamentsSkeleton } from '@/components/public/landing/tournaments-skeleton'
import { getSiteSettings } from '@/lib/data/settings'

export default async function LandingPage() {
    const settings = await getSiteSettings()

    return (
        <div className="flex flex-col gap-24 pb-24 overflow-x-hidden">
            <Hero />
            <Stats
                stats={{
                    years: settings.statsYears,
                    players: settings.statsPlayers,
                    tournaments: settings.statsTournaments,
                    matches: settings.statsMatches,
                }}
            />
            <Features />
            <Suspense fallback={<TournamentsSkeleton />}>
                <TournamentsSection />
            </Suspense>
            <StreamSection />
        </div>
    )
}
