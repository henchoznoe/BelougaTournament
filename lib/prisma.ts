/**
 * File: lib/prisma.ts
 * Description: Prisma client singleton instance.
 * Author: Noé Henchoz
 * Date: 2025-12-02
 * License: MIT
 */

import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../prisma/generated/prisma/client'

const globalForPrisma = global as unknown as { prisma: PrismaClient }

const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL,
})

const prisma =
    globalForPrisma.prisma ||
    new PrismaClient({
        adapter,
    })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export default prisma
