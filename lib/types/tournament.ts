/**
 * File: lib/types/tournament.ts
 * Description: Types for tournament management (admin, public, fields, registrations, teams).
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import type {
  FieldType,
  TournamentFormat,
  TournamentStatus,
} from '@/prisma/generated/prisma/enums'

// ---------------------------------------------------------------------------
// User registration types (profile page)
// ---------------------------------------------------------------------------

/** A user's registration with nested tournament info (for profile inscriptions). */
export type UserRegistrationItem = {
  id: string
  fieldValues: Record<string, string | number>
  createdAt: Date
  tournament: {
    id: string
    title: string
    slug: string
    game: string | null
    format: TournamentFormat
    startDate: Date
    status: TournamentStatus
    fields: TournamentFieldItem[]
  }
}

/** Tournament as displayed in the admin list table. */
export type TournamentListItem = {
  id: string
  title: string
  slug: string
  game: string | null
  format: TournamentFormat
  teamSize: number
  maxTeams: number | null
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

/** Full tournament detail for admin edit page. */
export type TournamentDetail = {
  id: string
  title: string
  slug: string
  description: string
  startDate: Date
  endDate: Date
  registrationOpen: Date
  registrationClose: Date
  maxTeams: number | null
  format: TournamentFormat
  teamSize: number
  game: string | null
  imageUrl: string | null
  rules: string | null
  prize: string | null
  toornamentId: string | null
  streamUrl: string | null
  status: TournamentStatus
  createdAt: Date
  updatedAt: Date
  fields: TournamentFieldItem[]
  toornamentStages: ToornamentStageItem[]
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
export type ToornamentStageItem = {
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
  user: {
    id: string
    name: string
    displayName: string
    image: string | null
    bannedUntil: Date | null
  }
  team: {
    id: string
    name: string
    captainId: string
    isFull: boolean
  } | null
}

/** A team member with user info for the admin teams table. */
export type TeamMemberItem = {
  id: string
  joinedAt: Date
  user: {
    id: string
    name: string
    displayName: string
    image: string | null
  }
}

/** Team row for the admin teams table. */
export type TeamItem = {
  id: string
  name: string
  isFull: boolean
  createdAt: Date
  captain: {
    id: string
    name: string
    displayName: string
    image: string | null
  }
  members: TeamMemberItem[]
  registration: {
    id: string
  } | null
}

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

/** Tournament card for the public list pages (published & archived). */
export type PublicTournamentListItem = {
  id: string
  title: string
  slug: string
  description: string
  game: string | null
  imageUrl: string | null
  format: TournamentFormat
  teamSize: number
  maxTeams: number | null
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

/** Full tournament detail for the public detail page. */
export type PublicTournamentDetail = {
  id: string
  title: string
  slug: string
  description: string
  game: string | null
  imageUrl: string | null
  format: TournamentFormat
  teamSize: number
  maxTeams: number | null
  status: TournamentStatus
  startDate: Date
  endDate: Date
  registrationOpen: Date
  registrationClose: Date
  rules: string | null
  prize: string | null
  toornamentId: string | null
  streamUrl: string | null
  fields: TournamentFieldItem[]
  toornamentStages: ToornamentStageItem[]
  _count: {
    registrations: number
    teams: number
  }
}

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
