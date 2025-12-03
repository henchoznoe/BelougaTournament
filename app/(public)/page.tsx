/**
 * File: app/(public)/page.tsx
 * Description: Landing page with hero section and featured tournaments.
 * Author: Noé Henchoz
 * Date: 2025-12-02
 * License: MIT
 */

import { LandingContent } from '@/components/public/landing-content'
import { prisma } from '@/lib/prisma'

async function getTournaments() {
    return await prisma.tournament.findMany({
        orderBy: { startDate: 'asc' },
        take: 6,
        where: { isArchived: false },
    })
}

export default async function LandingPage() {
    const tournaments = await getTournaments()

    return <LandingContent tournaments={tournaments} />
}
