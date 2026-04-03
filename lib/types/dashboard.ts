/**
 * File: lib/types/dashboard.ts
 * Description: Types for the admin dashboard stats and data.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import type {
  Role,
  TournamentFormat,
  TournamentStatus,
} from '@/prisma/generated/prisma/enums'

export type DashboardStats = {
  tournaments: {
    total: number
    byStatus: Record<TournamentStatus, number>
  }
  users: {
    total: number
    players: number
    admins: number
    ghosts: number
  }
  registrations: {
    total: number
    solo: number
    team: number
  }
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

export type RecentUser = {
  id: string
  name: string
  displayName: string
  image: string | null
  role: Role
  createdAt: Date
}

export type RecentSponsor = {
  id: string
  name: string
  imageUrls: string[]
  url: string | null
  createdAt: Date
}
