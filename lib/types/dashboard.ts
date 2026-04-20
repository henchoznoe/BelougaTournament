/**
 * File: lib/types/dashboard.ts
 * Description: Types for the admin dashboard stats and data.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import type { Role, TournamentStatus } from '@/prisma/generated/prisma/enums'

export type DashboardStats = {
  tournaments: {
    total: number
    byStatus: Record<TournamentStatus, number>
  }
  users: {
    total: number
    players: number
    admins: number
  }
  sponsors: {
    total: number
    enabled: number
    disabled: number
  }
}

export type RecentLogin = {
  id: string
  name: string
  displayName: string
  image: string | null
  role: Role
  lastLoginAt: Date
}

export type RecentRegistration = {
  id: string
  createdAt: Date
  user: {
    name: string
    image: string | null
  }
  tournament: {
    id: string
    title: string
    slug: string
  }
  team: {
    name: string
  } | null
}

export type PaymentStats = {
  totalRevenue: number
  totalRefunded: number
  totalStripeFees: number
  netRevenue: number
  transactionCount: number
  refundCount: number
  currency: string
  byTournament: {
    id: string
    title: string
    slug: string
    revenue: number
    refunded: number
    stripeFees: number
    paidCount: number
    refundedCount: number
  }[]
}
