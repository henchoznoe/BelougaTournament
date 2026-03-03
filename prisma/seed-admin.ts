/**
 * File: prisma/seed-admin.ts
 * Description: Seed script to create the initial admin users.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import 'dotenv/config'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'
import { PrismaClient } from './generated/prisma/client'

// Initial admin users
const INITIAL_USERS = [
  {
    email: 'henchoznoe@gmail.com',
    name: 'Noé Henchoz',
    displayName: 'Noé Henchoz',
    role: 'SUPERADMIN' as const,
  },
  {
    email: 'rutschoquentin@gmail.com',
    name: 'Quentin Rutscho',
    displayName: 'Quentin Rutscho',
    role: 'SUPERADMIN' as const,
  },
] as const

/**
 * Seed admin users into the database.
 * Accepts an existing PrismaClient instance (used by the orchestrator).
 */
export const seedAdmins = async (prisma: PrismaClient) => {
  console.log('Seeding admin users...')

  for (const user of INITIAL_USERS) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {
        role: user.role,
        emailVerified: true,
      },
      create: {
        email: user.email,
        name: user.name,
        displayName: user.displayName,
        role: user.role,
        emailVerified: true,
      },
    })

    console.log(`  User ${user.name} (${user.email}) is ready with role ${user.role}`)
  }

  console.log('Admin users seeded successfully!')
}

// Standalone execution (when run directly with tsx)
const isMainModule = import.meta.url === `file://${process.argv[1]}`

if (isMainModule) {
  const run = async () => {
    const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
    const adapter = new PrismaPg(pool)
    const prisma = new PrismaClient({ adapter })

    console.log('Starting seed process...')
    console.log('Connected to the database.')

    try {
      await seedAdmins(prisma)
      console.log('Seed completed successfully!')
    } catch (error) {
      console.error('Seed failed:', error)
      throw error
    } finally {
      console.log('Disconnecting from database...')
      await prisma.$disconnect()
      await pool.end()
    }
  }

  run().catch(error => {
    console.error('Fatal error during seeding:', error)
    process.exit(1)
  })
}
