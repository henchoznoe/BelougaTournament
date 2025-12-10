/**
 * File: lib/auth.ts
 * Description: Authentication configuration using Better Auth.
 * Author: Noé Henchoz
 * Date: 2025-12-08
 * License: MIT
 */

// ----------------------------------------------------------------------
// IMPORTS
// ----------------------------------------------------------------------

import { betterAuth } from 'better-auth'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import prisma from '@/lib/db/prisma'
import { env } from '@/lib/env'
import { Role } from '@/prisma/generated/prisma/enums'

// ----------------------------------------------------------------------
// LOGIC
// ----------------------------------------------------------------------

const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),
  trustedOrigins: [env.BETTER_AUTH_URL, env.NEXT_PUBLIC_APP_URL],
  socialProviders: {
    discord: {
      clientId: env.DISCORD_CLIENT_ID,
      clientSecret: env.DISCORD_CLIENT_SECRET,
    },
  },
  user: {
    additionalFields: {
      role: {
        type: 'string',
        required: false,
        defaultValue: Role.USER,
        input: false,
      },
    },
  },
})

export default auth
