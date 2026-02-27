/**
 * File: lib/services/users.ts
 * Description: Services for fetching user data.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

//import 'server-only'
import * as Sentry from '@sentry/nextjs'
import prisma from '@/lib/core/prisma'

/** Fetches the profile data for a given user ID. Returns null if not found. */
export const getUserProfile = async (userId: string) => {
  try {
    return await prisma.user.findUnique({
      where: { id: userId },
      select: {
        name: true,
        email: true,
        image: true,
        role: true,
        createdAt: true,
      },
    })
  } catch (error) {
    Sentry.captureException(error)
    return null
  }
}
