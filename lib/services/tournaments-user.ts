/**
 * File: lib/services/tournaments-user.ts
 * Description: User-specific tournament services (registration state, profile page data).
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import 'server-only'
// $queryRaw returns `unknown[]`; casts below assert the shape matches our domain types
// because Prisma cannot infer types from raw SQL at compile time.
import { cacheLife, cacheTag } from 'next/cache'
import { CACHE_TAGS } from '@/lib/config/constants'
import { logger } from '@/lib/core/logger'
import prisma from '@/lib/core/prisma'
import type {
  UserActiveTournament,
  UserRegistrationItem,
  UserTournamentRegistrationState,
} from '@/lib/types/tournament'
import { cleanupExpiredPendingRegistrations } from '@/lib/utils/registration-expiry'
import {
  PaymentStatus,
  RegistrationStatus,
  TournamentStatus,
} from '@/prisma/generated/prisma/enums'

/** Shared select for user registration items. */
const USER_REGISTRATION_SELECT = {
  id: true,
  fieldValues: true,
  createdAt: true,
  status: true,
  paymentStatus: true,
  paymentRequiredSnapshot: true,
  tournament: {
    select: {
      id: true,
      title: true,
      slug: true,
      games: true,
      format: true,
      teamSize: true,
      startDate: true,
      status: true,
      registrationType: true,
      entryFeeAmount: true,
      entryFeeCurrency: true,
      refundPolicyType: true,
      refundDeadlineDays: true,
      teamLogoEnabled: true,
      fields: {
        orderBy: { order: 'asc' as const },
        select: {
          id: true,
          label: true,
          type: true,
          required: true,
          order: true,
        },
      },
    },
  },
  team: {
    select: {
      id: true,
      name: true,
      captainId: true,
      logoUrl: true,
    },
  },
} as const

/** Fetches the current registration state for a user on a tournament, if any active record exists.
 *  NOTE: 'use cache' is intentionally absent — this is user-specific data that must never be shared
 *  across users via the shared cache. It is called per-request with the user's session. */
export const getUserTournamentRegistrationState = async (
  userId: string,
  tournamentId: string,
): Promise<UserTournamentRegistrationState | null> => {
  try {
    await cleanupExpiredPendingRegistrations(userId)

    const row = await prisma.tournamentRegistration.findFirst({
      where: {
        tournamentId,
        userId,
        status: {
          in: [RegistrationStatus.PENDING, RegistrationStatus.CONFIRMED],
        },
      },
      select: {
        id: true,
        status: true,
        paymentStatus: true,
        expiresAt: true,
      },
    })

    return row as UserTournamentRegistrationState | null
  } catch (error) {
    logger.error({ error }, 'Error fetching user tournament registration state')
    return null
  }
}

/** Fetches a user's registrations for PUBLISHED tournaments (active inscriptions). */
export const getUserRegistrations = async (
  userId: string,
): Promise<UserRegistrationItem[]> => {
  'use cache'
  cacheLife('hours')
  cacheTag(CACHE_TAGS.TOURNAMENTS)

  try {
    const rows = await prisma.tournamentRegistration.findMany({
      where: {
        userId,
        status: {
          in: [RegistrationStatus.PENDING, RegistrationStatus.CONFIRMED],
        },
        tournament: { status: TournamentStatus.PUBLISHED },
      },
      orderBy: { createdAt: 'desc' },
      select: USER_REGISTRATION_SELECT,
    })
    return rows as unknown as UserRegistrationItem[]
  } catch (error) {
    logger.error({ error }, 'Error fetching user registrations')
    return []
  }
}

/** Fetches a user's registrations for ARCHIVED tournaments (history). */
export const getUserPastRegistrations = async (
  userId: string,
): Promise<UserRegistrationItem[]> => {
  'use cache'
  cacheLife('hours')
  cacheTag(CACHE_TAGS.TOURNAMENTS)

  try {
    const rows = await prisma.tournamentRegistration.findMany({
      where: {
        userId,
        OR: [
          {
            status: RegistrationStatus.CONFIRMED,
            tournament: { status: TournamentStatus.ARCHIVED },
          },
          {
            status: RegistrationStatus.CANCELLED,
            paymentStatus: PaymentStatus.REFUNDED,
            tournament: { status: TournamentStatus.ARCHIVED },
          },
        ],
      },
      orderBy: { createdAt: 'desc' },
      select: USER_REGISTRATION_SELECT,
    })
    return rows as unknown as UserRegistrationItem[]
  } catch (error) {
    logger.error({ error }, 'Error fetching user past registrations')
    return []
  }
}

/** Fetches tournaments where the user has a CONFIRMED registration and the tournament is still PUBLISHED. */
export const getUserActiveTournaments = async (
  userId: string,
): Promise<UserActiveTournament[]> => {
  'use cache'
  cacheLife('hours')
  cacheTag(CACHE_TAGS.TOURNAMENTS)

  try {
    const rows = await prisma.tournament.findMany({
      where: {
        status: TournamentStatus.PUBLISHED,
        registrations: {
          some: {
            userId,
            status: RegistrationStatus.CONFIRMED,
          },
        },
      },
      orderBy: { startDate: 'asc' },
      select: {
        id: true,
        title: true,
        slug: true,
        games: true,
        startDate: true,
        imageUrls: true,
      },
    })
    return rows as UserActiveTournament[]
  } catch (error) {
    logger.error({ error }, 'Error fetching user active tournaments')
    return []
  }
}
