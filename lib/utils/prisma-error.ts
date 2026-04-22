/**
 * File: lib/utils/prisma-error.ts
 * Description: Maps Prisma client errors to user-friendly ActionState responses.
 *   Avoids leaking internal database details to the client.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import 'server-only'
import type { ActionState } from '@/lib/types/actions'
import { Prisma } from '@/prisma/generated/prisma/client'

/** Known Prisma error codes mapped to user-facing messages. */
const PRISMA_ERROR_MESSAGES: Record<string, string> = {
  P2000: 'La valeur fournie est trop longue.',
  P2002: 'Cette valeur existe déjà.',
  P2003: 'Un enregistrement lié est introuvable.',
  P2034: 'Cette opération a été modifiée en parallèle. Veuillez réessayer.',
  P2025: 'Enregistrement introuvable.',
}

const GENERIC_ERROR_MESSAGE =
  'Une erreur inattendue est survenue. Veuillez réessayer.'

/**
 * Converts a Prisma error into a typed ActionState failure.
 * Returns null if the error is not a known Prisma error (caller handles the fallback).
 */
export const handlePrismaError = (error: unknown): ActionState | null => {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    const message = PRISMA_ERROR_MESSAGES[error.code] ?? GENERIC_ERROR_MESSAGE
    return { success: false, message }
  }

  if (
    error instanceof Prisma.PrismaClientUnknownRequestError ||
    error instanceof Prisma.PrismaClientRustPanicError ||
    error instanceof Prisma.PrismaClientInitializationError
  ) {
    return { success: false, message: GENERIC_ERROR_MESSAGE }
  }

  return null
}
