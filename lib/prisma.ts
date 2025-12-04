/**
 * File: lib/prisma.ts
 * Description: Prisma client singleton instance.
 * Author: Noé Henchoz
 * Date: 2025-12-02
 * License: MIT
 */

import 'dotenv/config'
import { PrismaPg } from '@prisma/adapter-pg'
import { withAccelerate } from '@prisma/extension-accelerate'
import pg from 'pg'
import { PrismaClient } from '../prisma/generated/prisma/client'

const connectionString = `${process.env.DATABASE_URL}`
const pool = new pg.Pool({ connectionString })
const adapter = new PrismaPg(pool)

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient
}

export const prisma =
    globalForPrisma.prisma ||
    new PrismaClient({ adapter }).$extends(withAccelerate())

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
