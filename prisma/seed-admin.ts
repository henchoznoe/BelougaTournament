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
 * Parse a comma-separated email env var and derive a placeholder name
 * from the local part of each address.
 * The name is overwritten on first Discord OAuth login.
 */
const parseEmailsForRole = (envVar: string, role: 'ADMIN' | 'SUPER_ADMIN') => {
  const raw = process.env[envVar]?.trim()
  if (!raw) return []

  return raw
    .split(',')
    .map(e => e.trim())
    .filter(Boolean)
    .map(email => {
      const localPart = email.split('@')[0]
      const name = localPart.charAt(0).toUpperCase() + localPart.slice(1)
      return { email, name, displayName: name, role }
    })
}

/**
 * Seed admin and super admin users into the database.
 * Accepts an existing PrismaClient instance (used by the orchestrator).
 * Processes admins first, then super admins so the higher role wins on conflict.
 */
export const seedAdmins = async (prisma: PrismaClient) => {
  const admins = parseEmailsForRole('ADMIN_EMAILS', 'ADMIN')
  const superAdmins = parseEmailsForRole('SUPER_ADMIN_EMAILS', 'SUPER_ADMIN')
  const users = [...admins, ...superAdmins]

  if (users.length === 0) {
    console.log(
      'No ADMIN_EMAILS or SUPER_ADMIN_EMAILS configured — skipping admin seed.',
    )
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
