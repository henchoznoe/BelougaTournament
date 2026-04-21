/**
 * File: lib/types/tournament-user.ts
 * Description: Types for the user-facing tournament registration state and profile history.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import type { TournamentFieldItem } from '@/lib/types/tournament-admin'
import type {
  PaymentStatus,
  RefundPolicyType,
  RegistrationStatus,
  RegistrationType,
  TournamentFormat,
  TournamentStatus,
} from '@/prisma/generated/prisma/enums'

/** Minimal registration state for the current user on a specific tournament. */
export type UserTournamentRegistrationState = {
  id: string
  status: RegistrationStatus
  paymentStatus: PaymentStatus
  expiresAt: Date | null
}

/** A user's registration with nested tournament info (for profile inscriptions). */
export type UserRegistrationItem = {
  id: string
  fieldValues: Record<string, string | number>
  createdAt: Date
  status: RegistrationStatus
  paymentStatus: PaymentStatus
  paymentRequiredSnapshot: boolean
  tournament: {
    id: string
    title: string
    slug: string
    games: string[]
    format: TournamentFormat
    teamSize: number
    startDate: Date
    status: TournamentStatus
    registrationType: RegistrationType
    entryFeeAmount: number | null
    entryFeeCurrency: string | null
    refundPolicyType: RefundPolicyType
    refundDeadlineDays: number | null
    teamLogoEnabled: boolean
    fields: TournamentFieldItem[]
  }
  team: {
    id: string
    name: string
    captainId: string
    logoUrl: string | null
  } | null
}
