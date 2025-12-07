/**
 * File: lib/types/actions.ts
 * Description: Shared types for server actions.
 * Author: Noé Henchoz
 * Date: 2025-12-07
 * License: MIT
 */

// ----------------------------------------------------------------------
// TYPES & INTERFACES
// ----------------------------------------------------------------------

export type ActionState<T = unknown> = {
  success: boolean
  message?: string
  errors?: Record<string, string[]>
  inputs?: T
  timestamp?: number
}
