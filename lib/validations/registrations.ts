/**
 * File: lib/validations/registrations.ts
 * Description: Validation schemas for admin registration management operations.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { z } from 'zod'

/** Schema for admin-deleting a registration. */
export const deleteRegistrationSchema = z.object({
  registrationId: z.uuid('ID inscription invalide.'),
})

/** Schema for admin-updating custom field values on a registration. */
export const updateRegistrationFieldsSchema = z.object({
  registrationId: z.uuid('ID inscription invalide.'),
  fieldValues: z.record(z.string(), z.union([z.string(), z.number()])),
})

/** Schema for admin-moving a player to a different team in the same tournament. */
export const changeTeamSchema = z.object({
  registrationId: z.uuid('ID inscription invalide.'),
  targetTeamId: z.uuid('ID equipe cible invalide.'),
})

/** Schema for admin-promoting a team member to captain. */
export const promoteCaptainSchema = z.object({
  teamId: z.uuid('ID equipe invalide.'),
  userId: z.uuid('ID utilisateur invalide.'),
})
