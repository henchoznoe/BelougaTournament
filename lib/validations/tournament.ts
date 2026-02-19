/**
 * File: lib/validations/tournament.ts
 * Description: Validation schemas for tournament management
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { z } from 'zod'
import {
  FieldType,
  TournamentFormat,
  Visibility,
} from '@/prisma/generated/prisma/enums'

export const tournamentSchema = z.object({
  description: z.string().min(10, 'Description trop courte'),
  endDate: z.date(),
  fields: z.array(
    z.object({
      id: z.string().optional(),
      label: z.string().min(1, 'Label requis'),
      required: z.boolean().default(true),
      type: z.enum(FieldType),
    }),
  ),
  format: z.enum(TournamentFormat),
  maxParticipants: z.coerce.number().optional(),
  registrationClose: z.date(),
  registrationOpen: z.date(),
  slug: z.string().min(3, 'Slug trop court'),
  startDate: z.date(),
  streamUrl: z.url('URL invalide').optional().or(z.literal('')),
  teamSize: z.coerce.number().min(1, "Taille d'équipe invalide"),
  title: z.string().min(3, 'Titre trop court'),
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
  visibility: z.enum(Visibility),
})

export type TournamentSchema = z.infer<typeof tournamentSchema>
