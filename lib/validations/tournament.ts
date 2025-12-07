/**
 * File: lib/schemas/tournament.ts
 * Description: Tournament schema for validation.
 * Author: Noé Henchoz
 * Date: 2025-12-05
 * License: MIT
 */

import { z } from 'zod'
import { Visibility } from '@/prisma/generated/prisma/enums'

export const tournamentSchema = z.object({
  description: z
    .string()
    .min(10, 'La description doit contenir au moins 10 caractères'),
  endDate: z.date(),
  fields: z.array(
    z.object({
      id: z.string().optional(),
      label: z.string().min(1, 'Le libellé est requis'),
      required: z.boolean().default(true),
      type: z.enum(['TEXT', 'NUMBER', 'SELECT', 'CHECKBOX']),
    }),
  ),
  format: z.enum(['SOLO', 'TEAM']),
  maxParticipants: z.coerce.number().optional(),
  registrationClose: z.date(),
  registrationOpen: z.date(),
  slug: z.string().min(3, 'Le slug doit contenir au moins 3 caractères'),
  startDate: z.date(),
  streamUrl: z
    .string()
    .url("L'URL du stream est invalide")
    .optional()
    .or(z.literal('')),
  teamSize: z.coerce
    .number()
    .min(1, "La taille de l'équipe doit être d'au moins 1"),
  title: z.string().min(3, 'Le titre doit contenir au moins 3 caractères'),
})

export const deleteTournamentSchema = z.string()

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
