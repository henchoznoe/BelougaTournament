/**
 * File: lib/core/auth.ts
 * Description: Authentication configuration using Better Auth.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import 'server-only'
import { betterAuth } from 'better-auth'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import { AUTH_CONFIG, DISCORD } from '@/lib/config/constants'
import { env } from '@/lib/core/env'
import { logger } from '@/lib/core/logger'
import prisma from '@/lib/core/prisma'
import { Role } from '@/prisma/generated/prisma/enums'

/**
 * CSRF assumption: mutating endpoints are either
 *   (1) Server Actions (Next.js enforces an Origin check for these), or
 *   (2) the Stripe webhook (CSRF-immune via signature verification).
 * Session cookies are `SameSite=Lax` + `httpOnly` + `secure`, which blocks
 * cross-site POST with credentials. If a cookie-authenticated JSON endpoint
 * is ever added (form-like POST accepting JSON from the browser), enable
 * BetterAuth's CSRF token protection for it — do not rely on SameSite alone.
 */

/** Shape of the Discord /users/@me API response (relevant fields only). */
interface DiscordProfile {
  id: string
  username: string
  global_name: string | null
  avatar: string | null
}

const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),
  advanced: {
    database: {
      generateId: 'uuid',
    },
    cookiePrefix: 'belouga',
    defaultCookieAttributes: {
      secure: true,
      httpOnly: true,
      sameSite: 'lax' as const,
    },
  },
  session: {
    expiresIn: AUTH_CONFIG.SESSION_EXPIRES_IN,
    updateAge: AUTH_CONFIG.SESSION_UPDATE_AGE,
    cookieCache: {
      enabled: true,
      maxAge: AUTH_CONFIG.COOKIE_CACHE_MAX_AGE,
    },
  },
  rateLimit: {
    /** Rate limiting is disabled outside production to avoid blocking dev/test flows. */
    enabled: env.NODE_ENV === 'production',
    window: AUTH_CONFIG.RATE_LIMIT_WINDOW,
    max: AUTH_CONFIG.RATE_LIMIT_MAX,
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

            const updateData: Record<string, unknown> = {
              lastLoginAt: session.createdAt
                ? new Date(session.createdAt)
                : new Date(),
            }

            const discordAccount = user.accounts.find(
              acc => acc.providerId === 'discord',
            )

            if (discordAccount?.accessToken) {
              const response = await fetch(DISCORD.API_USER_URL, {
                headers: {
                  Authorization: `Bearer ${discordAccount.accessToken}`,
                },
              })

              if (response.ok) {
                const discordProfile: DiscordProfile = await response.json()

                const avatarUrl = discordProfile.avatar
                  ? DISCORD.AVATAR_CDN_URL(
                      discordProfile.id,
                      discordProfile.avatar,
                    )
                  : null

                const name =
                  discordProfile.global_name || discordProfile.username

                // Always sync Discord-controlled name and avatar.
                if (user.name !== name) updateData.name = name
                if (user.image !== avatarUrl) updateData.image = avatarUrl

                // discordId is an immutable identity anchor: only set it when unset.
                // Rebinding a different Discord account must happen through an
                // explicit admin flow, not a silent login-side effect.
                if (!user.discordId) {
                  updateData.discordId = discordProfile.id
                }

                // On first login, initialize displayName from Discord name
                if (!user.displayName) updateData.displayName = name
              }
            }

            await prisma.user.update({
              where: { id: user.id },
              data: updateData,
            })
          } catch (error) {
            // Log only the error message — avoid serializing request objects that
            // may carry the Discord bearer token in their headers.
            logger.error(
              {
                errorMessage:
                  error instanceof Error ? error.message : 'unknown',
                userId: session.userId,
              },
              'Failed to sync Discord profile',
            )
          }
        },
      },
    },
  },
})

export default auth
