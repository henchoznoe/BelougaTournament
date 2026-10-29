/**
 * File: lib/utils/auth-redirect.ts
 * Description: Safe OAuth redirect URLs and public error messages.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { AUTH_ERROR_MESSAGES } from '@/lib/config/constants/auth'
import { ROUTES } from '@/lib/config/routes'

export const getSafeAuthRedirect = (from?: string | null): string => {
  if (
    from?.startsWith('/') &&
    !from.startsWith('//') &&
    !from.includes('\\') &&
    !/\s/.test(from)
  ) {
    return from
  }
  return ROUTES.HOME
}

export const getLoginErrorUrl = (redirectTo: string): string => {
  const query = new URLSearchParams({ from: getSafeAuthRedirect(redirectTo) })
  return `${ROUTES.LOGIN}?${query}`
}

export const getAuthErrorMessage = (error: string | null): string | null => {
  if (!error) return null
  return error === 'access_denied'
    ? AUTH_ERROR_MESSAGES.CANCELLED
    : AUTH_ERROR_MESSAGES.FAILED
}
