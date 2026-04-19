/**
 * File: lib/core/prisma.ts
 * Description: Prisma client singleton instance.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import 'server-only'
import { PrismaPg } from '@prisma/adapter-pg'
import { withAccelerate } from '@prisma/extension-accelerate'
import { env } from '@/lib/core/env'
import { PrismaClient } from '@/prisma/generated/prisma/client'

const createPrismaClient = () => {
  const adapter = new PrismaPg({ connectionString: env.DATABASE_URL })
  return new PrismaClient({
    adapter,
    log: env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  }).$extends(withAccelerate())
}

type PrismaWithAccelerate = ReturnType<typeof createPrismaClient>

// Cast `global` to a typed object to safely store the Prisma singleton across
// hot-reloads in development without creating multiple client instances.
const globalForPrisma = global as unknown as {
  prisma: PrismaWithAccelerate | undefined
}

const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

export default prisma
