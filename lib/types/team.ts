/**
 * File: lib/types/team.ts
 * Description: Shared types for team-related operations (captain succession, membership mutations).
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

/** Team with ordered members list. Used by team helpers and registration actions. */
export interface TeamWithMembers {
  id: string
  name: string
  tournamentId?: string
  captainId: string
  isFull: boolean
  tournament: { teamSize: number }
  members: { userId: string; joinedAt: Date }[]
}

/** Team member with nested team (including members). */
export interface TeamMemberWithTeam {
  userId?: string
  joinedAt: Date
  team: TeamWithMembers
}
