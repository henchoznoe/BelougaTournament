/**
 * File: lib/types/registration.ts
 * Description: Types for the global admin registrations page.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import type {
  TournamentFormat,
  TournamentStatus,
} from '@/prisma/generated/prisma/enums'

/** A registration row for the global admin registrations table. */
export type RegistrationRow = {
  id: string
  createdAt: Date
  user: {
    id: string
    name: string
    displayName: string
    image: string | null
  }
  tournament: {
    id: string
    title: string
    slug: string
    format: TournamentFormat
    status: TournamentStatus
  }
  team: {
    id: string
    name: string
  } | null
}
