/**
 * File: lib/types/tournament-admin.ts
 * Description: Types for the admin tournament management UI:
 *   list items, detail, dynamic fields, Toornament stages, registrations, teams.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import type { UserSummary } from '@/lib/types/tournament-shared'
import type {
  DonationType,
  FieldType,
  PaymentStatus,
  RefundPolicyType,
  RegistrationStatus,
  RegistrationType,
  TournamentFormat,
  TournamentStatus,
} from '@/prisma/generated/prisma/enums'

/** Tournament as displayed in the admin list table. */
export type TournamentListItem = {
  id: string
  title: string
  slug: string
  games: string[]
  format: TournamentFormat
  teamSize: number
  maxTeams: number | null
  registrationType: RegistrationType
  entryFeeAmount: number | null
  entryFeeCurrency: string | null
  status: TournamentStatus
  startDate: Date
  endDate: Date
  registrationOpen: Date
  registrationClose: Date
  _count: {
    registrations: number
    teams: number
  }
}

/** A single dynamic field definition attached to a tournament. */
export type TournamentFieldItem = {
  id: string
  label: string
  type: FieldType
  required: boolean
  order: number
}

/** A Toornament stage linked to a tournament. */
type ToornamentStageItem = {
  id: string
  name: string
  stageId: string
  number: number
}

/** Full tournament detail for admin edit page. */
export type TournamentDetail = TournamentListItem & {
  description: string
  imageUrls: string[]
  showRegistrants: boolean
  refundPolicyType: RefundPolicyType
  refundDeadlineDays: number | null
  teamLogoEnabled: boolean
  donationEnabled: boolean
  donationType: DonationType | null
  donationFixedAmount: number | null
  donationMinAmount: number | null
  rules: string | null
  prize: string | null
  toornamentId: string | null
  streamUrl: string | null
  fields: TournamentFieldItem[]
  toornamentStages: ToornamentStageItem[]
  createdAt: Date
  updatedAt: Date
}

/** Registration row for the admin inscriptions table. */
export type TournamentRegistrationItem = {
  id: string
  fieldValues: Record<string, string | number>
  donationAmountSnapshot: number | null
  createdAt: Date
  status: RegistrationStatus
  paymentStatus: PaymentStatus
  user: UserSummary
  team: {
    id: string
    name: string
    captainId: string
    isFull: boolean
    logoUrl: string | null
  } | null
}

/** A team member with user info for the admin teams table. */
export type TeamMemberItem = {
  id: string
  joinedAt: Date
  user: UserSummary
}

/** Team row for the admin teams table. */
export type TeamItem = {
  id: string
  name: string
  logoUrl: string | null
  isFull: boolean
  createdAt: Date
  captain: UserSummary
  members: TeamMemberItem[]
}
