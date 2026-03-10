/**
 * File: lib/types/dashboard.ts
 * Description: Types for the admin dashboard stats and data.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import type {
  TournamentFormat,
  TournamentStatus,
} from '@/prisma/generated/prisma/enums'

export type DashboardStats = {
  tournaments: {
    total: number
    byStatus: Record<TournamentStatus, number>
  }
  players: number
  totalRegistrations: number
  sponsors: number
}

export type UpcomingTournament = {
  id: string
  title: string
  slug: string
  game: string | null
  format: TournamentFormat
  teamSize: number
  startDate: Date
  status: TournamentStatus
  _count: {
    registrations: number
    teams: number
  }
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
