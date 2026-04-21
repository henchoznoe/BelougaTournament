/**
 * File: lib/types/tournament-form.ts
 * Description: Form value type derived from the tournament Zod create schema.
 *   Used by all tournament form sub-components.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import type { z } from 'zod'
import type { tournamentSchema } from '@/lib/validations/tournament-crud'

/** Form output type derived from the Zod create schema (post-parse, post-defaults).
 *  The update schema is a superset (adds `id`); both are used via resolver union. */
export type TournamentFormValues = z.output<typeof tournamentSchema> & {
  id?: string
}
