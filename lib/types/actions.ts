/**
 * File: lib/types/actions.ts
 * Description: Shared types for server actions.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

export type ActionState<T = unknown> = {
  success: boolean
  message?: string
  errors?: Record<string, string[]>
  data?: T
}
