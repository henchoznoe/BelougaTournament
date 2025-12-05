/**
 * File: lib/auth.ts
 * Description: Server-side session management using cookies.
 * Author: Noé Henchoz
 * Date: 2025-12-02
 * License: MIT
 */

import { unstable_cache } from 'next/cache'
import { cookies } from 'next/headers'
import { cache } from 'react'
import { decrypt, UserRole } from '@/lib/auth-core'
import prisma from '@/lib/prisma'

export * from '@/lib/auth-core'

// Cached user fetcher to prevent database hammering
// 1. React cache() deduplicates requests within a single render pass
const getCachedUser = cache(async (userId: string) => {
    // 2. unstable_cache caches the result for 60 seconds (cross-request)
    return unstable_cache(
        async () => {
            return prisma.user.findUnique({
                where: { id: userId },
                select: { id: true, email: true, role: true },
            })
        },
        ['user-role', userId], // Key parts
        {
            tags: ['user-role', userId], // Revalidation tags
            revalidate: 60,
        },
    )()
})

export async function getSession() {
    const sessionCookie = (await cookies()).get('session')?.value
    if (!sessionCookie) return null
    try {
        const payload = await decrypt(sessionCookie)

        // Verify user against database (cached)
        const user = await getCachedUser(payload.user.id)

        if (!user) return null

        // Ensure user still has admin privileges
        if (user.role !== UserRole.ADMIN && user.role !== UserRole.SUPERADMIN) {
            return null
        }

        // Return session with fresh user data
        return {
            ...payload,
            user: {
                id: user.id,
                email: user.email,
                role: user.role as UserRole,
            },
        }
    } catch (_error) {
        return null
    }
}
