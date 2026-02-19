/**
 * File: lib/core/prisma.ts
 * Description: Prisma client singleton instance.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { PrismaPg } from '@prisma/adapter-pg'
import { withAccelerate } from '@prisma/extension-accelerate'
import { env } from '@/lib/core/env'
import { PrismaClient } from '@/prisma/generated/prisma/client'

const createPrismaClient = () => {
  const adapter = new PrismaPg({ connectionString: env.DATABASE_URL })
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  }).$extends(withAccelerate())
}

export type PrismaWithAccelerate = ReturnType<typeof createPrismaClient>

const globalForPrisma = global as unknown as {
  prisma: PrismaWithAccelerate | undefined
}

const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

export default prisma
