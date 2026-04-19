/**
 * File: components/admin/tournaments/form/tournament-form-types.ts
 * Description: Shared types and constants for the tournament form sub-components.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import type { z } from 'zod'
import type { tournamentSchema } from '@/lib/validations/tournaments'

/** Form output type derived from the Zod create schema (post-parse, post-defaults).
 *  The update schema is a superset (adds `id`); both are used via resolver union. */
export type TournamentFormValues = z.output<typeof tournamentSchema> & {
  id?: string
}

export interface BlobItem {
  url: string
  pathname: string
  size: number
  uploadedAt: string
}
