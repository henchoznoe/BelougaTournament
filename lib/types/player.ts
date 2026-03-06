/**
 * File: lib/types/player.ts
 * Description: Types for the admin players management page.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import type { BAN_DURATION_OPTIONS } from '@/lib/config/constants'
import type { Role } from '@/prisma/generated/prisma/enums'

/** A player as displayed in the admin players table. */
export type PlayerRow = {
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
  _count: {
    registrations: number
  }
}

export type BanDurationValue = (typeof BAN_DURATION_OPTIONS)[number]['value']
