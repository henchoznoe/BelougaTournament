/**
 * File: lib/prisma.ts
 * Description: Prisma client singleton instance.
 * Author: Noé Henchoz
 * Date: 2025-12-05
 * License: MIT
 */

import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../prisma/generated/prisma/client'

// Constants
const ENV_VAR_KEYS = {
  DATABASE_URL: 'DATABASE_URL',
  NODE_ENV: 'NODE_ENV',
} as const

const ENV_VAR_VALUES = {
  PRODUCTION: 'production',
} as const

const ERRORS = {
  MISSING_ENV: `Missing environment variables. Please check ${ENV_VAR_KEYS.DATABASE_URL} and ${ENV_VAR_KEYS.NODE_ENV}.`,
} as const

// Get database configuration
const getDatabaseConfiguration = () => {
  const url = process.env[ENV_VAR_KEYS.DATABASE_URL]
  const env = process.env[ENV_VAR_KEYS.NODE_ENV]

  if (!url || !env) {
    throw new Error(ERRORS.MISSING_ENV)
  }

  return { url, env }
}

// Create Prisma client
const createPrismaClient = (connectionString: string): PrismaClient => {
  const adapter = new PrismaPg({ connectionString })
  return new PrismaClient({ adapter })
}

// Initialize Prisma client and export singleton instance
const config = getDatabaseConfiguration()
const globalForPrisma = global as unknown as { prisma: PrismaClient }
const prisma = globalForPrisma.prisma ?? createPrismaClient(config.url)
if (config.env !== ENV_VAR_VALUES.PRODUCTION) {
  globalForPrisma.prisma = prisma
}

export default prisma
