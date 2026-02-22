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
import prisma from '@/lib/core/prisma'
import { Role } from '@/prisma/generated/prisma/enums'

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

            if (
              user.name !== name ||
              user.image !== avatarUrl ||
              user.discordId !== discordProfile.id
            ) {
              await prisma.user.update({
                where: { id: user.id },
                data: {
                  name: name,
                  image: avatarUrl,
                  discordId: discordProfile.id,
                },
              })
            }
          } catch (error) {
            console.error('Failed to sync Discord profile', error)
          }
        },
      },
    },
  },
})

export default auth
