/**
 * File: lib/schemas/tournament.ts
 * Description: Tournament schema for validation.
 * Author: Noé Henchoz
 * Date: 2025-12-05
 * License: MIT
 */

import { z } from 'zod'

export const tournamentSchema = z.object({
  description: z.string().min(10, 'Description must be at least 10 characters'),
  endDate: z.date(),
  fields: z.array(
    z.object({
      id: z.string().optional(),
      label: z.string().min(1, 'Label is required'),
      required: z.boolean().default(true),
      type: z.enum(['TEXT', 'NUMBER', 'SELECT', 'CHECKBOX']),
    }),
  ),
  format: z.enum(['SOLO', 'TEAM']),
  maxParticipants: z.coerce.number().optional(),
  registrationClose: z.date(),
  registrationOpen: z.date(),
  slug: z.string().min(3, 'Slug must be at least 3 characters'),
  startDate: z.date(),
  streamUrl: z.string().url().optional().or(z.literal('')),
  teamSize: z.coerce.number().min(1),
  title: z.string().min(3, 'Title must be at least 3 characters'),
})

export type TournamentSchema = z.infer<typeof tournamentSchema>
