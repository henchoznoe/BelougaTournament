/**
 * File: lib/utils/errors.ts
 * Description: Utility function for error handling
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

export const getErrorMessage = (error: unknown, fallback: string): string => {
  if (error instanceof Error) {
    return error.message
  }
  return fallback
}
