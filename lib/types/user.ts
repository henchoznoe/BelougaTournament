/**
 * File: lib/types/user.ts
 * Description: Types for admin user management (table list and detail page).
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

/** A user as displayed in the admin users table (lightweight). */
export type UserRow = {
  id: string
  name: string
  displayName: string
  email: string
  image: string | null
  discordId: string | null
  role: Role
  createdAt: Date
  lastLoginAt: Date | null
  bannedUntil: Date | null
  banReason: string | null
  _count: { registrations: number }
}

/** A registration entry nested inside a UserDetail. */
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

/** Full user data for the admin user detail page. */
export type UserDetail = {
  id: string
  name: string
  displayName: string
  email: string
  image: string | null
  discordId: string | null
  role: Role
  createdAt: Date
  lastLoginAt: Date | null
  bannedUntil: Date | null
  banReason: string | null
  registrations: UserRegistrationRow[]
}

/** Ban duration option value type. */
export type BanDurationValue = (typeof BAN_DURATION_OPTIONS)[number]['value']
