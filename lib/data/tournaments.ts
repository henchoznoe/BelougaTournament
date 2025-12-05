/**
 * File: lib/data/tournaments.ts
 * Description: Data access functions for tournaments.
 */

import prisma from '@/lib/prisma'

/**
 * Fetches all public, non-archived, and active tournaments.
 * Ordered by start date.
 */
export async function getPublicTournaments() {
    return await prisma.tournament.findMany({
        orderBy: { startDate: 'asc' },
        where: {
            isArchived: false,
            endDate: {
                gte: new Date(),
            },
        },
    })
}
