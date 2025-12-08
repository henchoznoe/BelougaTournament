/**
 * File: prisma/seed-admin.ts
 * Description: Seed script to create the initial admin user for OAuth.
 * Author: Noé Henchoz
 * Date: 2025-12-08
 * License: MIT
 */

// ----------------------------------------------------------------------
// IMPORTS
// ----------------------------------------------------------------------

import "dotenv/config"
import { PrismaPg } from "@prisma/adapter-pg"
import pg from "pg"
import { env } from "../lib/env"
import { PrismaClient } from "./generated/prisma/client"
import { Role } from '@/prisma/generated/prisma/enums'

// ----------------------------------------------------------------------
// LOGIC
// ----------------------------------------------------------------------

const createPrismaClient = (connectionString: string): PrismaClient => {
  const pool = new pg.Pool({ connectionString })
  const adapter = new PrismaPg(pool)
  return new PrismaClient({ adapter })
}

const main = async () => {
  const prisma = createPrismaClient(env.DATABASE_URL)

  try {
    const user = await prisma.user.upsert({
      where: { email: env.ADMIN_EMAIL },
      update: {
        role: Role.SUPERADMIN,
        emailVerified: true
      },
      create: {
        email: env.ADMIN_EMAIL,
        name: "Noé Henchoz",
        role: Role.SUPERADMIN,
        emailVerified: true
      },
    })

    console.log(
      `Seed successful: ${user.name} (${user.email}) is ready with role ${user.role}`,
    )
  } catch (error) {
    console.error("Seed failed:", error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
