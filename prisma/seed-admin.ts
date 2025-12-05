/**
 * File: prisma/seed-admin.ts
 * Description: Seed script to create the initial admin user.
 * Author: Noé Henchoz
 * Date: 2025-12-05
 * License: MIT
 */

import 'dotenv/config';
import { PrismaClient, Role } from './generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import { hash } from 'bcryptjs';

// Constants
const ENV_KEYS = {
  DATABASE_URL: 'DATABASE_URL',
  ADMIN_EMAIL: 'ADMIN_EMAIL',
  ADMIN_PASSWORD: 'ADMIN_PASSWORD',
} as const

const SECURITY_CONFIG = {
  SALT_ROUNDS: 12,
} as const

const ERRORS = {
  MISSING_ENV: `Missing environment variables. Please check: ${Object.values(ENV_KEYS).join(', ')}`,
} as const

function getSeedConfig() {
  const url = process.env[ENV_KEYS.DATABASE_URL]
  const email = process.env[ENV_KEYS.ADMIN_EMAIL]
  const password = process.env[ENV_KEYS.ADMIN_PASSWORD]

  if (!url || !email || !password) {
    throw new Error(ERRORS.MISSING_ENV)
  }

  return { url, email, password }
}

function createPrismaClient(connectionString: string): PrismaClient {
  const pool = new pg.Pool({ connectionString })
  const adapter = new PrismaPg(pool)
  return new PrismaClient({ adapter })
}

async function main() {

  const config = getSeedConfig()
  const prisma = createPrismaClient(config.url)

  try {
    const hashedPassword = await hash(config.password, SECURITY_CONFIG.SALT_ROUNDS)

    const user = await prisma.user.upsert({
      where: { email: config.email },
      update: {
        passwordHash: hashedPassword,
        role: Role.SUPERADMIN
      },
      create: {
        email: config.email,
        passwordHash: hashedPassword,
        role: Role.SUPERADMIN,
      },
    })

    console.log(`Seed successful: ${user.email} is ready with role ${user.role}`)
  } catch (error) {
    console.error('Seed failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
