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
import { VALIDATION_MESSAGES } from '@/lib/config/messages'
import { Visibility } from '@/prisma/generated/prisma/enums'

// ----------------------------------------------------------------------
// CONSTANTS
// ----------------------------------------------------------------------

export const tournamentSchema = z.object({
  description: z.string().min(10, VALIDATION_MESSAGES.DESCRIPTION_MIN),
  endDate: z.date(),
  fields: z.array(
    z.object({
      id: z.string().optional(),
      label: z.string().min(1, VALIDATION_MESSAGES.LABEL_REQUIRED),
      required: z.boolean().default(true),
      type: z.enum(['TEXT', 'NUMBER']),
    }),
  ),
  format: z.enum(['SOLO', 'TEAM']),
  maxParticipants: z.coerce.number().optional(),
  registrationClose: z.date(),
  registrationOpen: z.date(),
  slug: z.string().min(3, VALIDATION_MESSAGES.SLUG_MIN),
  startDate: z.date(),
  streamUrl: z
    .string()
    .url(VALIDATION_MESSAGES.STREAM_URL_INVALID)
    .optional()
    .or(z.literal('')),
  teamSize: z.coerce.number().min(1, VALIDATION_MESSAGES.TEAM_SIZE_MIN),
  title: z.string().min(3, VALIDATION_MESSAGES.TITLE_MIN),
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
