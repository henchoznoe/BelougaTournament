/**
 * File: lib/data/tournaments.ts
 * Description: Data access functions for tournaments.
 */

import { unstable_cache } from 'next/cache'
import prisma from '@/lib/prisma'

/**
 * Fetches all public, non-archived, and active tournaments.
 * Ordered by start date.
 * Cached for 1 hour, revalidated on tag 'tournaments'.
 */
export const getPublicTournaments = unstable_cache(
    async () => {
        return await prisma.tournament.findMany({
            orderBy: { startDate: 'asc' },
            where: {
                isArchived: false,
                endDate: {
                    gte: new Date(),
                },
            },
        })
    },
    ['tournaments'],
    {
        tags: ['tournaments'],
        revalidate: 3600,
    },
)
