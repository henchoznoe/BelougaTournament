/**
 * File: lib/auth.ts
 * Description: Server-side session management using cookies.
 * Author: Noé Henchoz
 * Date: 2025-12-02
 * License: MIT
 */

import { cookies } from 'next/headers'
import { decrypt, UserRole } from '@/lib/auth-core'
import { prisma } from '@/lib/prisma'

export * from '@/lib/auth-core'

export async function getSession() {
    const session = (await cookies()).get('session')?.value
    if (!session) return null
    try {
        const payload = await decrypt(session)

        // Verify user against database for instant revocation
        const user = await prisma.user.findUnique({
            where: { id: payload.user.id },
            select: { id: true, email: true, role: true },
        })

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
