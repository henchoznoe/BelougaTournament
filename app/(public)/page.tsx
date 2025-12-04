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

export default function LandingPage() {
    return (
        <div className="flex flex-col gap-24 pb-24 overflow-x-hidden">
            <Hero />
            <Stats />
            <Features />
            <Suspense fallback={<TournamentsSkeleton />}>
                <TournamentsSection />
            </Suspense>
            <StreamSection />
        </div>
    )
}
