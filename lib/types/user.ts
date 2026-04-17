/**
 * File: lib/types/user.ts
 * Description: Types for admin user management (table list and detail page).
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

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
  registrations: UserRegistrationRow[]
}
