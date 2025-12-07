/**
 * File: lib/config/auth.ts
 * Description: Authentication configuration settings.
 * Author: Noé Henchoz
 * Date: 2025-12-07
 * License: MIT
 */

export const AUTH_CONFIG = {
  COOKIE_NAME: 'session',
  SESSION_DURATION_MS: 24 * 60 * 60 * 1000, // 24 hours
} as const
