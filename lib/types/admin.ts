/**
 * File: lib/types/admin.ts
 * Description: Types for the admin management page.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import type { Role, TournamentStatus } from '@/prisma/generated/prisma/enums'

/** An admin user with their tournament assignments. */
export type AdminUser = {
  id: string
  name: string
  displayName: string
  email: string
  image: string | null
  role: Role
  createdAt: Date
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

/** Minimal tournament data for the assignment picker. */
export type TournamentOption = {
  id: string
  title: string
  slug: string
  status: TournamentStatus
}
