/**
 * File: lib/prisma.ts
 * Description: Prisma client singleton instance.
 * Author: Noé Henchoz
 * Date: 2025-12-02
 * License: MIT
 */

import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined
}

export const prisma =
    globalForPrisma.prisma ??
    new PrismaClient({
        log:
            process.env.NODE_ENV === 'development'
                ? ['error', 'warn']
                : ['error'],
    })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
