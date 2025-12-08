/**
 * File: lib/validations/tournament.ts
 * Description: Tournament schema for validation.
 * Author: Noé Henchoz
 * Date: 2025-12-07
 * License: MIT
 */

// ----------------------------------------------------------------------
// IMPORTS
// ----------------------------------------------------------------------

import { z } from 'zod'
import { fr } from '@/lib/i18n/dictionaries/fr'
import { Visibility } from '@/prisma/generated/prisma/enums'

// ----------------------------------------------------------------------
// CONSTANTS
// ----------------------------------------------------------------------

export const tournamentSchema = z.object({
  description: z.string().min(10, fr.common.server.validations.descriptionMin),
  endDate: z.date(),
  fields: z.array(
    z.object({
      id: z.string().optional(),
      label: z.string().min(1, fr.common.server.validations.labelRequired),
      required: z.boolean().default(true),
      type: z.enum(['TEXT', 'NUMBER']),
    }),
  ),
  format: z.enum(['SOLO', 'TEAM']),
  maxParticipants: z.coerce.number().optional(),
  registrationClose: z.date(),
  registrationOpen: z.date(),
  slug: z.string().min(3, fr.common.server.validations.slugMin),
  startDate: z.date(),
  streamUrl: z
    .string()
    .url(fr.common.server.validations.streamUrlInvalid)
    .optional()
    .or(z.literal('')),
  teamSize: z.coerce.number().min(1, fr.common.server.validations.teamSizeMin),
  title: z.string().min(3, fr.common.server.validations.titleMin),
})

export const deleteTournamentSchema = z.object({
  id: z.string(),
})

export const updateTournamentSchema = z.object({
  id: z.string(),
  data: tournamentSchema,
})

export const exportTournamentSchema = z.string()

export const toggleVisibilitySchema = z.object({
  id: z.string(),
  visibility: z.nativeEnum(Visibility),
})

export type TournamentSchema = z.infer<typeof tournamentSchema>
