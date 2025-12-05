/**
 * File: lib/data/tournaments.ts
 * Description: Data access functions for tournaments.
 * Author: Noé Henchoz
 * Date: 2025-12-05
 * License: MIT
 */

import { unstable_cache } from 'next/cache'
import prisma from '@/lib/prisma'

// Constants
const CACHE_CONFIG = {
    KEY_TOURNAMENTS: 'tournaments',
    REVALIDATE_SECONDS: 3600, // 1 hour
} as const

const fetchPublicTournamentsFromDb = async () => {
    return prisma.tournament.findMany({
        orderBy: { startDate: 'asc' },
        where: {
            isArchived: false,
            endDate: {
                gte: new Date(),
            },
        },
        include: {
            _count: {
                select: {
                    registrations: true,
                },
            },
        },
    })
}

export const getPublicTournaments = unstable_cache(
    fetchPublicTournamentsFromDb,
    [CACHE_CONFIG.KEY_TOURNAMENTS],
    {
        tags: [CACHE_CONFIG.KEY_TOURNAMENTS],
        revalidate: CACHE_CONFIG.REVALIDATE_SECONDS,
    },
)
