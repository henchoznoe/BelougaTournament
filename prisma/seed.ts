/**
 * File: prisma/seed.ts
 * Description: Seed orchestrator — provisions admin users from SUPERADMIN_EMAILS.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { PrismaPg } from '@prisma/adapter-pg'
import { config } from 'dotenv'
import pg from 'pg'
import { PrismaClient } from './generated/prisma/client'
import { seedAdmins } from './seed-admin'

config({ path: '.env.local' })

const main = async () => {
  // Skip seeding entirely in test environment
  if (process.env.NODE_ENV === 'test') {
    console.log('Skipping seed in test environment.')
    return
  }

  // Setup connection pool and Prisma client
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
  const adapter = new PrismaPg(pool)
  const prisma = new PrismaClient({ adapter })

  console.log('Starting seed process...')

  try {
    await seedAdmins(prisma)
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
