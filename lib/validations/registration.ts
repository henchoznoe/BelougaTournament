/**
 * File: lib/validations/registration.ts
 * Description: Validation schemas for registration
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { z } from 'zod'

export const registrationSchema = z.object({
  contactEmail: z.email('Email invalide'),
  players: z
    .array(
      z.object({
        data: z.record(z.string(), z.string()),
        nickname: z.string().min(1, 'Pseudo requis'),
      }),
    )
    .min(1, 'Au moins un joueur requis'),
  teamName: z.string().optional(),
  tournamentId: z.uuid(),
})

export type RegistrationInput = z.infer<typeof registrationSchema>
