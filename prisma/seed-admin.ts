/**
 * File: prisma/seed-admin.ts
 * Description: Seed script to create the initial admin user.
 * Author: Noé Henchoz
 * Date: 2025-12-07
 * License: MIT
 */

import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { hash } from 'bcryptjs';
import pg from 'pg';
import { env } from '../lib/env';
import { PrismaClient, Role } from './generated/prisma/client';

// Constants
const SECURITY_CONFIG = {
  SALT_ROUNDS: 12,
} as const

function createPrismaClient(connectionString: string): PrismaClient {
  const pool = new pg.Pool({ connectionString })
  const adapter = new PrismaPg(pool)
  return new PrismaClient({ adapter })
}

async function main() {

  const prisma = createPrismaClient(env.DATABASE_URL)

  try {
    const hashedPassword = await hash(env.ADMIN_PASSWORD, SECURITY_CONFIG.SALT_ROUNDS)

    const user = await prisma.user.upsert({
      where: { email: env.ADMIN_EMAIL },
      update: {
        passwordHash: hashedPassword,
        role: Role.SUPERADMIN
      },
      create: {
        email: env.ADMIN_EMAIL,
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
