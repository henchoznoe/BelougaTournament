/**
 * File: lib/types/tournament.ts
 * Description: Types for tournament management (admin list, detail, fields, registrations, teams).
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import type {
  FieldType,
  RegistrationStatus,
  TournamentFormat,
  TournamentStatus,
} from '@/prisma/generated/prisma/enums'

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
  autoApprove: boolean
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
  autoApprove: boolean
  status: TournamentStatus
  createdAt: Date
  updatedAt: Date
  fields: TournamentFieldItem[]
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

/** Registration row for the admin inscriptions table. */
export type TournamentRegistrationItem = {
  id: string
  status: RegistrationStatus
  fieldValues: Record<string, string | number>
  createdAt: Date
  user: {
    id: string
    name: string
    displayName: string
    image: string | null
  }
  team: {
    id: string
    name: string
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
    status: RegistrationStatus
  } | null
}
