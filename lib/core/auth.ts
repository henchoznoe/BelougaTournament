/**
 * File: lib/core/auth.ts
 * Description: Authentication configuration using Better Auth.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { betterAuth } from 'better-auth'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import { env } from '@/lib/core/env'
import { logger } from '@/lib/core/logger'
import prisma from '@/lib/core/prisma'
import { Role } from '@/prisma/generated/prisma/enums'

const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),
  advanced: {
    database: {
      generateId: 'uuid',
    },
  },
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
      discordId: {
        type: 'string',
        required: false,
        input: false,
      },
      displayName: {
        type: 'string',
        required: true,
        input: false,
      },
    },
  },
  databaseHooks: {
    session: {
      create: {
        after: async session => {
          try {
            const user = await prisma.user.findUnique({
              where: { id: session.userId },
              include: { accounts: true },
            })

            if (!user) return

            const discordAccount = user.accounts.find(
              acc => acc.providerId === 'discord',
            )
            if (!discordAccount?.accessToken) return

            const response = await fetch('https://discord.com/api/users/@me', {
              headers: {
                Authorization: `Bearer ${discordAccount.accessToken}`,
              },
            })

            if (!response.ok) return

            const discordProfile = await response.json()

            const avatarUrl = discordProfile.avatar
              ? `https://cdn.discordapp.com/avatars/${discordProfile.id}/${discordProfile.avatar}.png`
              : null

            const name = discordProfile.global_name || discordProfile.username

            const updateData: Record<string, unknown> = {}

            // Always sync Discord-controlled fields
            if (user.name !== name) updateData.name = name
            if (user.image !== avatarUrl) updateData.image = avatarUrl
            if (user.discordId !== discordProfile.id)
              updateData.discordId = discordProfile.id

            // On first login, initialize displayName from Discord name
            if (!user.displayName) updateData.displayName = name

            if (Object.keys(updateData).length > 0) {
              await prisma.user.update({
                where: { id: user.id },
                data: updateData,
              })
            }
          } catch (error) {
            logger.error(
              { error, userId: session.userId },
              'Failed to sync Discord profile',
            )
          }
        },
      },
    },
  },
})

export default auth
