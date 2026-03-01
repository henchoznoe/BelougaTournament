/**
 * File: lib/types/player.ts
 * Description: Types for the admin players management page.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

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

/** Sentinel date used for permanent bans. */
export const PERMANENT_BAN_DATE = new Date('9999-12-31T23:59:59.999Z')

/** Predefined ban duration options. */
export const BAN_DURATION_OPTIONS = [
  { label: 'Permanent', value: 'permanent' },
  { label: '1 jour', value: '1d' },
  { label: '7 jours', value: '7d' },
  { label: '30 jours', value: '30d' },
  { label: '90 jours', value: '90d' },
  { label: 'Date personnalisée', value: 'custom' },
] as const

export type BanDurationValue = (typeof BAN_DURATION_OPTIONS)[number]['value']
