/**
 * File: prisma/seed-admin.ts
 * Description: Seed script to create the initial admin users.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import "dotenv/config"
import { PrismaPg } from "@prisma/adapter-pg"
import pg from "pg"
import { PrismaClient } from "./generated/prisma/client"
import { Role } from '@/prisma/generated/prisma/enums'
import { env } from "@/lib/core/env"

type InitialUser = {
  email: string
  name: string
  role: Role
}

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

// Create Prisma client
const createPrismaClient = (connectionString: string): PrismaClient => {
  const pool = new pg.Pool({ connectionString })
  const adapter = new PrismaPg(pool)
  return new PrismaClient({ adapter })
}

// Main function to create the initial admin users
const main = async () => {
  console.log("Seeding...")
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
        `User ${user.name} (${user.email}) is ready with role ${user.role}`,
      )
    }
    console.log("Seed completed successfully!")
  } catch (error) {
    console.error("Seed failed:", error)
    throw error
  } finally {
    console.log("Disconnecting from database...")
    await prisma.$disconnect()
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
