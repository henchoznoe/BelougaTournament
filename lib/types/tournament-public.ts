/**
 * File: lib/types/tournament-public.ts
 * Description: Types for the public-facing tournament pages:
 *   list cards, detail view, hero badge, available teams, active tournaments.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import type { TournamentFieldItem } from '@/lib/types/tournament-admin'
import type {
  DonationType,
  RefundPolicyType,
  RegistrationType,
  TournamentFormat,
  TournamentStatus,
} from '@/prisma/generated/prisma/enums'

/** A confirmed registrant shown on public tournament pages when showRegistrants is enabled. */
export type PublicTournamentRegistrant = {
  userId: string
  displayName: string
  image: string | null
  isPublic: boolean
}

/** A team with members shown on public tournament pages when showRegistrants is enabled. */
export type PublicTournamentTeamRegistrant = {
  teamId: string
  teamName: string
  logoUrl: string | null
  members: PublicTournamentRegistrant[]
}

/** Tournament card for the public list pages (published & archived). */
export type PublicTournamentListItem = {
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
  description: string
  imageUrls: string[]
  _count: {
    registrations: number
    teams: number
  }
}

/** Full tournament detail for the public detail page. */
export type PublicTournamentDetail = PublicTournamentListItem & {
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
  toornamentStages: {
    id: string
    name: string
    stageId: string
    number: number
  }[]
}

/** Dynamic badge state displayed in the landing page hero. */
type HeroTournamentBadgeVariant = 'idle' | 'upcoming' | 'live'

/** A minimal public tournament shape used to compute the hero badge. */
export type HeroTournamentBadgeTournament = {
  slug: string
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
