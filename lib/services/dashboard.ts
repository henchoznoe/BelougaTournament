/**
 * File: lib/services/dashboard.ts
 * Description: Services for fetching admin dashboard statistics.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import 'server-only'
// $queryRaw returns `unknown[]`; casts below assert the shape matches our domain types
// because Prisma cannot infer types from raw SQL at compile time.
import { cacheLife, cacheTag } from 'next/cache'
import { CACHE_TAGS, DEFAULT_CURRENCY } from '@/lib/config/constants'
import { logger } from '@/lib/core/logger'
import prisma from '@/lib/core/prisma'
import type {
  DashboardStats,
  PaymentStats,
  RecentLogin,
  RecentRegistration,
} from '@/lib/types/dashboard'
import {
  PaymentStatus,
  RegistrationStatus,
  Role,
  TournamentStatus,
} from '@/prisma/generated/prisma/enums'

/** Fetches aggregate stats for the dashboard cards. */
export const getDashboardStats = async (): Promise<DashboardStats> => {
  'use cache'
  cacheLife('minutes')
  cacheTag(CACHE_TAGS.DASHBOARD_STATS)

  try {
    const [
      tournaments,
      draftCount,
      publishedCount,
      archivedCount,
      totalUsers,
      players,
      admins,
      superAdmins,
      banned,
      totalSponsors,
      enabledSponsors,
    ] = await Promise.all([
      prisma.tournament.count(),
      prisma.tournament.count({ where: { status: TournamentStatus.DRAFT } }),
      prisma.tournament.count({
        where: { status: TournamentStatus.PUBLISHED },
      }),
      prisma.tournament.count({ where: { status: TournamentStatus.ARCHIVED } }),
      prisma.user.count(),
      prisma.user.count({ where: { role: Role.USER } }),
      prisma.user.count({ where: { role: Role.ADMIN } }),
      prisma.user.count({ where: { role: Role.SUPER_ADMIN } }),
      prisma.user.count({ where: { bannedAt: { not: null } } }),
      prisma.sponsor.count(),
      prisma.sponsor.count({ where: { enabled: true } }),
    ])

    return {
      tournaments: {
        total: tournaments,
        byStatus: {
          [TournamentStatus.DRAFT]: draftCount,
          [TournamentStatus.PUBLISHED]: publishedCount,
          [TournamentStatus.ARCHIVED]: archivedCount,
        },
      },
      users: {
        total: totalUsers,
        players,
        admins,
        superAdmins,
        banned,
      },
      sponsors: {
        total: totalSponsors,
        enabled: enabledSponsors,
        disabled: totalSponsors - enabledSponsors,
      },
    }
  } catch (error) {
    logger.error({ error }, 'Error fetching dashboard stats')
    return {
      tournaments: {
        total: 0,
        byStatus: {
          [TournamentStatus.DRAFT]: 0,
          [TournamentStatus.PUBLISHED]: 0,
          [TournamentStatus.ARCHIVED]: 0,
        },
      },
      users: {
        total: 0,
        players: 0,
        admins: 0,
        superAdmins: 0,
        banned: 0,
      },
      sponsors: {
        total: 0,
        enabled: 0,
        disabled: 0,
      },
    }
  }
}

/** Fetches users with the most recent login activity. */
export const getRecentLogins = async (limit = 8): Promise<RecentLogin[]> => {
  'use cache'
  cacheLife('minutes')
  cacheTag(CACHE_TAGS.DASHBOARD_RECENT_USERS)

  try {
    const rows = await prisma.user.findMany({
      where: { lastLoginAt: { not: null } },
      orderBy: { lastLoginAt: 'desc' },
      take: limit,
      select: {
        id: true,
        name: true,
        displayName: true,
        image: true,
        role: true,
        lastLoginAt: true,
      },
    })
    return rows as unknown as RecentLogin[]
  } catch (error) {
    logger.error({ error }, 'Error fetching recent logins')
    return []
  }
}

/** Fetches the most recent tournament registrations. */
export const getRecentRegistrations = async (
  limit = 8,
): Promise<RecentRegistration[]> => {
  'use cache'
  cacheLife('minutes')
  cacheTag(CACHE_TAGS.DASHBOARD_REGISTRATIONS)

  try {
    const rows = await prisma.tournamentRegistration.findMany({
      where: {
        status: {
          in: [RegistrationStatus.PENDING, RegistrationStatus.CONFIRMED],
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        createdAt: true,
        user: {
          select: {
            name: true,
            image: true,
          },
        },
        tournament: {
          select: {
            id: true,
            title: true,
            slug: true,
          },
        },
        team: {
          select: {
            name: true,
          },
        },
      },
    })
    return rows as unknown as RecentRegistration[]
  } catch (error) {
    logger.error({ error }, 'Error fetching recent registrations')
    return []
  }
}

/** Fetches aggregate payment/revenue stats for the dashboard. */
export const getDashboardPaymentStats = async (): Promise<PaymentStats> => {
  'use cache'
  cacheLife('minutes')
  cacheTag(CACHE_TAGS.DASHBOARD_PAYMENTS)

  const emptyStats: PaymentStats = {
    totalRevenue: 0,
    totalRefunded: 0,
    totalStripeFees: 0,
    netRevenue: 0,
    transactionCount: 0,
    refundCount: 0,
    forfeitedCount: 0,
    totalDonations: 0,
    donationCount: 0,
    currency: DEFAULT_CURRENCY,
    byTournament: [],
  }

  try {
    // Fetch all paid, refunded and forfeited payments with their tournament info
    const payments = await prisma.payment.findMany({
      where: {
        status: {
          in: [
            PaymentStatus.PAID,
            PaymentStatus.REFUNDED,
            PaymentStatus.FORFEITED,
          ],
        },
      },
      select: {
        amount: true,
        currency: true,
        status: true,
        refundAmount: true,
        stripeFee: true,
        donationAmount: true,
        registration: {
          select: {
            tournament: {
              select: {
                id: true,
                title: true,
                slug: true,
              },
            },
          },
        },
      },
    })

    if (payments.length === 0) return emptyStats

    // Aggregate totals
    let totalRevenue = 0
    let totalRefunded = 0
    let totalStripeFees = 0
    let totalDonations = 0
    let transactionCount = 0
    let refundCount = 0
    let forfeitedCount = 0
    let donationCount = 0
    const currency = payments[0].currency || DEFAULT_CURRENCY
    if (payments[0].currency && payments[0].currency !== DEFAULT_CURRENCY) {
      logger.warn(
        { currency: payments[0].currency },
        `Unexpected currency detected in payment stats (expected ${DEFAULT_CURRENCY})`,
      )
    }

    // Group by tournament
    const tournamentMap = new Map<
      string,
      {
        id: string
        title: string
        slug: string
        revenue: number
        refunded: number
        forfeited: number
        stripeFees: number
        donations: number
        paidCount: number
        refundedCount: number
        forfeitedCount: number
        donationCount: number
      }
    >()

    for (const payment of payments) {
      const tournament = payment.registration.tournament

      if (!tournamentMap.has(tournament.id)) {
        tournamentMap.set(tournament.id, {
          id: tournament.id,
          title: tournament.title,
          slug: tournament.slug,
          revenue: 0,
          refunded: 0,
          forfeited: 0,
          stripeFees: 0,
          donations: 0,
          paidCount: 0,
          refundedCount: 0,
          forfeitedCount: 0,
          donationCount: 0,
        })
      }

      const entry = tournamentMap.get(tournament.id)
      if (!entry) continue

      if (payment.status === PaymentStatus.PAID) {
        totalRevenue += payment.amount
        totalStripeFees += payment.stripeFee ?? 0
        transactionCount++
        entry.revenue += payment.amount
        entry.stripeFees += payment.stripeFee ?? 0
        entry.paidCount++
      }

      if (payment.status === PaymentStatus.REFUNDED) {
        // Refunded payments were originally paid, so count the original amount as revenue
        totalRevenue += payment.amount
        totalStripeFees += payment.stripeFee ?? 0
        transactionCount++
        entry.revenue += payment.amount
        entry.stripeFees += payment.stripeFee ?? 0
        entry.paidCount++

        // Then track the refund
        const refund = payment.refundAmount ?? payment.amount
        totalRefunded += refund
        refundCount++
        entry.refunded += refund
        entry.refundedCount++
      }

      if (payment.status === PaymentStatus.FORFEITED) {
        // Forfeited payments: full amount received, Stripe fees still apply, no refund issued.
        // The organisation keeps the net amount (amount - stripeFee).
        // The forfeited entry fee (amount - donationAmount) is also counted as a donation,
        // since the player voluntarily chose to leave their funds to the organisation.
        totalRevenue += payment.amount
        totalStripeFees += payment.stripeFee ?? 0
        transactionCount++
        forfeitedCount++
        entry.revenue += payment.amount
        entry.stripeFees += payment.stripeFee ?? 0
        entry.forfeited += payment.amount
        entry.paidCount++
        entry.forfeitedCount++

        // Count the forfeited entry fee as a donation
        const forfeitedEntryFee = payment.amount - (payment.donationAmount ?? 0)
        if (forfeitedEntryFee > 0) {
          totalDonations += forfeitedEntryFee
          donationCount++
          entry.donations += forfeitedEntryFee
          entry.donationCount++
        }
      }

      // Aggregate optional Stripe donation amounts (PAID payments only; FORFEITED handled above)
      if (
        payment.status !== PaymentStatus.FORFEITED &&
        payment.donationAmount &&
        payment.donationAmount > 0
      ) {
        totalDonations += payment.donationAmount
        donationCount++
        entry.donations += payment.donationAmount
        entry.donationCount++
      }
    }

    // Sort tournaments by revenue descending
    const byTournament = [...tournamentMap.values()].sort(
      (a, b) => b.revenue - a.revenue,
    )

    return {
      totalRevenue,
      totalRefunded,
      totalStripeFees,
      netRevenue: totalRevenue - totalRefunded - totalStripeFees,
      transactionCount,
      refundCount,
      forfeitedCount,
      totalDonations,
      donationCount,
      currency,
      byTournament,
    }
  } catch (error) {
    logger.error({ error }, 'Error fetching dashboard payment stats')
    return emptyStats
  }
}
