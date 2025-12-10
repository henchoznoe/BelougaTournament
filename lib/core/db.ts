/**
 * File: lib/db/prisma.ts
 * Description: Prisma client singleton instance.
 * Author: Noé Henchoz
 * Date: 2025-12-07
 * License: MIT
 */

// ----------------------------------------------------------------------
// IMPORTS
// ----------------------------------------------------------------------

import { PrismaPg } from '@prisma/adapter-pg'
import { env } from '@/lib/core/env'
import { PrismaClient } from '@/prisma/generated/prisma/client'

// ----------------------------------------------------------------------
// LOGIC
// ----------------------------------------------------------------------

const createPrismaClient = (connectionString: string): PrismaClient => {
  // biome-ignore lint/suspicious/noExplicitAny: library type definition mismatch workaround
  const adapter = new PrismaPg({ connectionString }) as any
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })
}

const globalForPrisma = global as unknown as { prisma: PrismaClient }

const prisma = globalForPrisma.prisma ?? createPrismaClient(env.DATABASE_URL)

if (env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

export default prisma
