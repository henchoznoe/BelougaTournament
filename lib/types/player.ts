/**
 * File: lib/types/player.ts
 * Description: Types for public player pages (list and profile).
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import type { Role, TournamentFormat } from '@/prisma/generated/prisma/enums'

/** Player card for the public players list page. */
export type PublicPlayerListItem = {
  id: string
  displayName: string
  image: string | null
  role: Role
  createdAt: Date
  tournamentCount: number
}

/** Tournament entry displayed on a public player profile. */
type PublicPlayerTournamentEntry = {
  tournamentTitle: string
  tournamentSlug: string
  games: string[]
  startDate: Date
  format: TournamentFormat
}

/** Full public player profile. */
export type PublicPlayerProfile = {
  id: string
  displayName: string
  image: string | null
  role: Role
  createdAt: Date
  tournamentHistory: PublicPlayerTournamentEntry[]
}
