/**
 * File: lib/config/constants/admin.ts
 * Description: Admin UI constants — pagination sizes, tournament display helpers, upload limits.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { TournamentStatus } from '@/prisma/generated/prisma/enums'

/** Per-list pagination sizes for admin list views. */
export const ADMIN_PAGE_SIZES = {
  TOURNAMENTS: 10,
  REGISTRATIONS: 10,
  USERS: 20,
  SPONSORS: 8,
} as const

/** French labels for tournament statuses. */
export const TOURNAMENT_STATUS_LABELS: Record<TournamentStatus, string> = {
  [TournamentStatus.DRAFT]: 'Brouillon',
  [TournamentStatus.PUBLISHED]: 'Publié',
  [TournamentStatus.ARCHIVED]: 'Archivé',
} as const

/** Compact styles for tournament statuses (used in badges and admin UI). */
export const TOURNAMENT_STATUS_STYLES: Record<TournamentStatus, string> = {
  [TournamentStatus.DRAFT]: 'bg-amber-500/10 text-amber-400',
  [TournamentStatus.PUBLISHED]: 'bg-emerald-500/10 text-emerald-400',
  [TournamentStatus.ARCHIVED]: 'bg-zinc-500/10 text-zinc-400',
} as const

/** Number of characters to display for Toornament IDs in the admin UI. */
export const TOORNAMENT_ID_DISPLAY_LENGTH = 12

/** Maximum upload file sizes in bytes. */
export const MAX_ADMIN_UPLOAD_SIZE = 5 * 1024 * 1024 // 5 MB
export const MAX_TEAM_LOGO_SIZE = 2 * 1024 * 1024 // 2 MB

/** Maximum length for Twitch username. */
export const TWITCH_USERNAME_MAX_LENGTH = 25
