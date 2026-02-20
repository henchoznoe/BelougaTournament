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
import { Role } from "@/prisma/generated/prisma/enums"
import { env } from "@/lib/core/env"

const seedDatabase = async () => {
  // Define initial data within the function scope to avoid global variables
  const initialUsers = [
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

  // Setup connection pool and adapter
  const pool = new pg.Pool({ connectionString: env.DATABASE_URL })
  const adapter = new PrismaPg(pool)
  const prisma = new PrismaClient({ adapter })

  console.log("Starting seed process...")
  console.log("Connected to the database.")

  try {
    for (const user of initialUsers) {
      // Upsert user and log in a single iteration
      await prisma.user.upsert({
        where: { email: user.email },
        update: {
          role: user.role,
          emailVerified: true,
        },
        create: {
          email: user.email,
          name: user.name,
          role: user.role,
          emailVerified: true,
        },
      })

      console.log(`User ${user.name} (${user.email}) is ready with role ${user.role}`)
    }

    console.log("Seed completed successfully!")
  } catch (error) {
    console.error("Seed failed:", error)
    throw error
  } finally {
    console.log("Disconnecting from database...")
    await prisma.$disconnect()
    await pool.end()
  }
}

seedDatabase().catch((error) => {
  console.error("Fatal error during seeding:", error)
  process.exit(1)
})
