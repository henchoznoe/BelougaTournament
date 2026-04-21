/**
 * File: lib/types/tournament-shared.ts
 * Description: Shared building blocks reused across tournament admin and public types.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

/** Minimal user info reused across registration, team member, and captain types. */
export type UserSummary = {
  id: string
  name: string
  displayName: string
  image: string | null
}
