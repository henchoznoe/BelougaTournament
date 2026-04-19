/**
 * File: lib/types/tournament.ts
 * Description: Types for tournament management (admin, public, fields, registrations, teams).
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import type {
  FieldType,
  PaymentStatus,
  RefundPolicyType,
  RegistrationStatus,
  RegistrationType,
  TournamentFormat,
  TournamentStatus,
} from '@/prisma/generated/prisma/enums'

// ---------------------------------------------------------------------------
// Shared building blocks
// ---------------------------------------------------------------------------

/** Minimal user info reused across registration, team member, and captain types. */
export type UserSummary = {
  id: string
  name: string
  displayName: string
  image: string | null
}

/** Registration + team aggregate counts attached to tournaments. */
type TournamentCounts = {
  _count: {
    registrations: number
    teams: number
  }
}

/** Core tournament fields shared between admin and public list items. */
type TournamentListBase = {
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
} & TournamentCounts

/** Core tournament fields shared between admin and public detail types. */
type TournamentDetailBase = TournamentListBase & {
  description: string
  imageUrls: string[]
  refundPolicyType: RefundPolicyType
  refundDeadlineDays: number | null
  teamLogoEnabled: boolean
  rules: string | null
  prize: string | null
  toornamentId: string | null
  streamUrl: string | null
  fields: TournamentFieldItem[]
  toornamentStages: ToornamentStageItem[]
}

// ---------------------------------------------------------------------------
// User registration state
// ---------------------------------------------------------------------------

export type UserTournamentRegistrationState = {
  id: string
  status: RegistrationStatus
  paymentStatus: PaymentStatus
  expiresAt: Date | null
}

// ---------------------------------------------------------------------------
// User registration types (profile page)
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Admin types
// ---------------------------------------------------------------------------

/** Tournament as displayed in the admin list table. */
export type TournamentListItem = TournamentListBase

/** Full tournament detail for admin edit page. */
export type TournamentDetail = TournamentDetailBase & {
  createdAt: Date
  updatedAt: Date
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

/** Registration row for the admin inscriptions table. */
export type TournamentRegistrationItem = {
  id: string
  fieldValues: Record<string, string | number>
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

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

/** Tournament card for the public list pages (published & archived). */
export type PublicTournamentListItem = TournamentListBase & {
  description: string
  imageUrls: string[]
}

/** Full tournament detail for the public detail page. */
export type PublicTournamentDetail = TournamentDetailBase

/** Dynamic badge state displayed in the landing page hero. */
export type HeroTournamentBadgeVariant = 'idle' | 'upcoming' | 'live'

/** A minimal public tournament shape used to compute the hero badge. */
export type HeroTournamentBadgeTournament = {
  title: string
  startDate: Date | string
  endDate: Date | string
}

/** Dynamic badge state displayed in the landing page hero. */
export type HeroTournamentBadge = {
  label: string
  variant: HeroTournamentBadgeVariant
}

/** Full data payload required by the landing hero badge. */
export type HeroTournamentBadgeData = {
  badge: HeroTournamentBadge
  tournaments: HeroTournamentBadgeTournament[]
}

/** A non-full team available for joining in the public registration dropdown. */
export type AvailableTeam = {
  id: string
  name: string
  captain: {
    displayName: string
  }
  _count: {
    members: number
  }
}

export type UserActiveTournament = {
  id: string
  title: string
  slug: string
  games: string[]
  startDate: Date
  imageUrls: string[]
}
