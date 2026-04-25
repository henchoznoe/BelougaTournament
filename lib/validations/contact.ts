/**
 * File: lib/validations/contact.ts
 * Description: Zod schema for the public contact form.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { z } from 'zod'
import {
  CONTACT_SUBJECT_VALUES,
  VALIDATION_LIMITS,
} from '@/lib/config/constants'

export const contactSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(
      VALIDATION_LIMITS.CONTACT_NAME_MIN,
      `Le nom doit contenir au moins ${VALIDATION_LIMITS.CONTACT_NAME_MIN} caractères.`,
    )
    .max(
      VALIDATION_LIMITS.CONTACT_NAME_MAX,
      `Le nom ne peut pas dépasser ${VALIDATION_LIMITS.CONTACT_NAME_MAX} caractères.`,
    ),
  email: z
    .email('Adresse e-mail invalide.')
    .max(
      VALIDATION_LIMITS.CONTACT_EMAIL_MAX,
      `L'adresse e-mail ne peut pas dépasser ${VALIDATION_LIMITS.CONTACT_EMAIL_MAX} caractères.`,
    ),
  phone: z
    .string()
    .trim()
    .max(
      VALIDATION_LIMITS.CONTACT_PHONE_MAX,
      `Le numéro ne peut pas dépasser ${VALIDATION_LIMITS.CONTACT_PHONE_MAX} caractères.`,
    )
    .optional()
    .or(z.literal('')),
  subject: z.enum(CONTACT_SUBJECT_VALUES, {
    error: 'Veuillez sélectionner un sujet.',
  }),
  message: z
    .string()
    .trim()
    .min(
      VALIDATION_LIMITS.CONTACT_MESSAGE_MIN,
      `Le message doit contenir au moins ${VALIDATION_LIMITS.CONTACT_MESSAGE_MIN} caractères.`,
    )
    .max(
      VALIDATION_LIMITS.CONTACT_MESSAGE_MAX,
      `Le message ne peut pas dépasser ${VALIDATION_LIMITS.CONTACT_MESSAGE_MAX} caractères.`,
    ),
})

export type ContactInput = z.infer<typeof contactSchema>
