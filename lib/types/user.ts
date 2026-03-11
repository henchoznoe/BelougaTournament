/**
 * File: lib/types/user.ts
 * Description: Types for the unified admin users management page.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import type { BAN_DURATION_OPTIONS } from '@/lib/config/constants'
import type {
  Role,
  TournamentFormat,
  TournamentStatus,
} from '@/prisma/generated/prisma/enums'

/** A user as displayed in the unified admin users table. */
export type UserRow = {
  id: string
  name: string
  displayName: string
  email: string
  image: string | null
  discordId: string | null
  role: Role
  createdAt: Date
  bannedUntil: Date | null
  banReason: string | null
  registrations: UserRegistrationRow[]
  adminOf: {
    id: string
    tournamentId: string
    tournament: {
      id: string
      title: string
      slug: string
    }
  }[]
}

/** A registration entry nested inside a UserRow. */
export type UserRegistrationRow = {
  id: string
  createdAt: Date
  tournament: {
    title: string
    format: TournamentFormat
    status: TournamentStatus
  }
  team: { name: string } | null
}

/** Minimal tournament data for the assignment picker. */
export type TournamentOption = {
  id: string
  title: string
  slug: string
  status: TournamentStatus
}

/** Ban duration option value type. */
export type BanDurationValue = (typeof BAN_DURATION_OPTIONS)[number]['value']
