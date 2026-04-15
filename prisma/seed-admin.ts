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

/**
 * Parse the ADMIN_EMAILS env var (comma-separated list of emails)
 * and derive a placeholder name from the local part of each address.
 * The name is overwritten on first Discord OAuth login.
 */
const parseAdminEmails = () => {
  const raw = process.env.ADMIN_EMAILS?.trim()
  if (!raw) return []

  return raw
    .split(',')
    .map(e => e.trim())
    .filter(Boolean)
    .map(email => {
      const localPart = email.split('@')[0]
      const name = localPart.charAt(0).toUpperCase() + localPart.slice(1)
      return { email, name, displayName: name, role: 'ADMIN' as const }
    })
}

/**
 * Seed admin users into the database.
 * Accepts an existing PrismaClient instance (used by the orchestrator).
 */
export const seedAdmins = async (prisma: PrismaClient) => {
  const users = parseAdminEmails()

  if (users.length === 0) {
    console.log('No ADMIN_EMAILS configured — skipping admin seed.')
    return
  }

  console.log('Seeding admin users...')

  for (const user of users) {
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

    console.log(`  User ${user.email} is ready with role ${user.role}`)
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
