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
// TYPES
// ----------------------------------------------------------------------

type InitialUser = {
  email: string
  name: string
  role: Role
}

// ----------------------------------------------------------------------
// CONSTANTS
// ----------------------------------------------------------------------

const INITIAL_USERS: InitialUser[] = [
  {
    email: "henchoznoe@gmail.com",
    name: "Noé Henchoz",
    role: Role.SUPERADMIN,
  },
  {
    email: "rutschoquentin@gmail.com",
    name: "Quentin Rutscho",
    role: Role.SUPERADMIN,
  }
]

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
    for (const user of INITIAL_USERS) {
      await prisma.user.upsert({
        where: { email: user.email },
        update: {
          role: user.role,
          emailVerified: true
      },
      create: {
        email: user.email,
        name: user.name,
        role: user.role,
        emailVerified: true
      },
    })
    }
    for (const user of INITIAL_USERS) {
      console.log(
        `Seed successful: ${user.name} (${user.email}) is ready with role ${user.role}`,
      )
    }
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
