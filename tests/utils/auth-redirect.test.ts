/**
 * File: tests/utils/auth-redirect.test.ts
 * Description: Regression tests for OAuth failure redirects and public feedback.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { describe, expect, it } from 'vitest'
import { AUTH_ERROR_MESSAGES } from '@/lib/config/constants/auth'
import {
  getAuthErrorMessage,
  getLoginErrorUrl,
  getSafeAuthRedirect,
} from '@/lib/utils/auth-redirect'

describe('OAuth redirect handling', () => {
  it.each([
    undefined,
    null,
    '',
    'https://other.example',
    '//other.example',
    '/\\other.example',
    '/\n/other.example',
  ])('falls back to home for an unsafe destination: %s', destination => {
    expect(getSafeAuthRedirect(destination)).toBe('/')
  })

  it('preserves a relative destination and its query string', () => {
    expect(getSafeAuthRedirect('/profile?tab=registrations')).toBe(
      '/profile?tab=registrations',
    )
  })

  it('preserves the destination when OAuth returns to the login page', () => {
    const url = new URL(
      getLoginErrorUrl('/tournaments/duo?register=true'),
      'https://dev.belougatournament.ch',
    )
    url.searchParams.set('error', 'internal_server_error')
    expect(url.pathname).toBe('/login')
    expect(url.searchParams.get('from')).toBe('/tournaments/duo?register=true')
    expect(url.searchParams.get('error')).toBe('internal_server_error')
  })
})

describe('OAuth error messages', () => {
  it.each([null, ''])('does not report an error for %s', error => {
    expect(getAuthErrorMessage(error)).toBeNull()
  })

  it('explains a cancelled Discord authorization', () => {
    expect(getAuthErrorMessage('access_denied')).toBe(
      AUTH_ERROR_MESSAGES.CANCELLED,
    )
  })

  it.each([
    'internal_server_error',
    'unknown_error',
    '<script>private error details</script>',
    'toString',
  ])('shows a safe generic message for %s', error => {
    expect(getAuthErrorMessage(error)).toBe(AUTH_ERROR_MESSAGES.FAILED)
  })
})
