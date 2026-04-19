/**
 * File: lib/services/users.ts
 * Description: Services for fetching user data (profile, admin table, and detail page).
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import 'server-only'
import { cacheLife, cacheTag } from 'next/cache'
import { CACHE_TAGS } from '@/lib/config/constants'
import { logger } from '@/lib/core/logger'
import prisma from '@/lib/core/prisma'
import type { UserDetail, UserProfile, UserRow } from '@/lib/types/user'

/** Fetches the profile data for a given user ID. Returns null if not found. */
export const getUserProfile = async (
  userId: string,
): Promise<UserProfile | null> => {
  try {
    return (await prisma.user.findUnique({
      where: { id: userId },
      select: {
        name: true,
        displayName: true,
        email: true,
        image: true,
        role: true,
        createdAt: true,
        lastLoginAt: true,
      },
    })) as UserProfile | null
  } catch (error) {
    logger.error({ error }, 'Error fetching user profile')
    return null
  }
}

/** Fetches all users for the admin users table (lightweight). */
export const getUsers = async (): Promise<UserRow[]> => {
  'use cache'
  cacheLife('minutes')
  cacheTag(CACHE_TAGS.USERS)

  try {
    const rows = await prisma.user.findMany({
      orderBy: [{ role: 'desc' }, { name: 'asc' }],
      select: {
        id: true,
        name: true,
        displayName: true,
        email: true,
        image: true,
        discordId: true,
        role: true,
        createdAt: true,
        lastLoginAt: true,
      },
    })
    return rows as unknown as UserRow[]
  } catch (error) {
    logger.error({ error }, 'Error fetching users')
    return []
  }
}

/** Fetches a single user with full detail for the admin user detail page. Returns null if not found. */
export const getUserById = async (
  userId: string,
): Promise<UserDetail | null> => {
  'use cache'
  cacheLife('minutes')
  cacheTag(CACHE_TAGS.USERS)

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        displayName: true,
        email: true,
        image: true,
        discordId: true,
        role: true,
        createdAt: true,
        lastLoginAt: true,
        registrations: {
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            createdAt: true,
            status: true,
            paymentStatus: true,
            entryFeeAmountSnapshot: true,
            entryFeeCurrencySnapshot: true,
            tournament: {
              select: {
                title: true,
                slug: true,
                format: true,
                status: true,
              },
            },
            team: {
              select: {
                name: true,
              },
            },
            payments: {
              orderBy: { createdAt: 'desc' },
              select: {
                id: true,
                amount: true,
                currency: true,
                status: true,
                paidAt: true,
                refundAmount: true,
              },
            },
          },
        },
      },
    })
    return user as UserDetail | null
  } catch (error) {
    logger.error({ error }, 'Error fetching user by ID')
    return null
  }
}
