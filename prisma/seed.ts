/**
 * File: prisma/seed.ts
 * Description: Seed orchestrator — runs admin seed always, dummy data in dev/preview only.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { PrismaPg } from '@prisma/adapter-pg'
import { config } from 'dotenv'
import pg from 'pg'
import { PrismaClient } from './generated/prisma/client'
import { seedAdmins } from './seed-admin'
import { seedDummy } from './seed-dummy'

config({ path: '.env.local' })

const main = async () => {
  const nodeEnv = process.env.NODE_ENV
  const vercelEnv = process.env.VERCEL_ENV

  // Skip seeding entirely in test environment
  if (nodeEnv === 'test') {
    console.log('Skipping seed in test environment.')
    return
  }

  // Setup connection pool and Prisma client
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
  const adapter = new PrismaPg(pool)
  const prisma = new PrismaClient({ adapter })

  console.log('Starting seed process...')
  console.log(
    `Environment: NODE_ENV=${nodeEnv}, VERCEL_ENV=${vercelEnv ?? 'N/A'}`,
  )

  try {
    // Always seed admin users
    await seedAdmins(prisma)

    // Seed dummy data unless we are in production
    const isProduction = vercelEnv === 'production'

    if (!isProduction) {
      console.log('\nDummy data seeding enabled for this environment.')
      await seedDummy(prisma)
    } else {
      console.log('\nSkipping dummy data (production environment).')
    }

    console.log('\nSeed completed successfully!')
  } catch (error) {
    console.error('Seed failed:', error)
    throw error
  } finally {
    console.log('Disconnecting from database...')
    await prisma.$disconnect()
    await pool.end()
  }
}

main().catch(error => {
  console.error('Fatal error during seeding:', error)
  process.exit(1)
})
