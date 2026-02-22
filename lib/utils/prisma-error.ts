/**
 * File: lib/utils/prisma-error.ts
 * Description: Maps Prisma client errors to user-friendly ActionState responses.
 *   Avoids leaking internal database details to the client.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import type { ActionState } from '@/lib/types/actions'
import { Prisma } from '@/prisma/generated/prisma/client'

/** Known Prisma error codes mapped to user-facing messages. */
const PRISMA_ERROR_MESSAGES: Record<string, string> = {
  P2000: 'The provided value is too long.',
  P2002: 'This value already exists.',
  P2003: 'A related record could not be found.',
  P2025: 'Record not found.',
}

const GENERIC_ERROR_MESSAGE = 'An unexpected error occurred. Please try again.'

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
