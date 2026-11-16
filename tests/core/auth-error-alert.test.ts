/**
 * File: tests/core/auth-error-alert.test.ts
 * Description: Checks that OAuth callback failures render visible, safe, accessible feedback.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import { AuthErrorAlert } from '@/components/public/auth/auth-error-alert'

const { navigation } = vi.hoisted(() => ({ navigation: { query: '' } }))
vi.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams(navigation.query),
}))

describe('AuthErrorAlert', () => {
  it('does not display a banner on a normal page', () => {
    navigation.query = ''
    expect(renderToStaticMarkup(createElement(AuthErrorAlert))).toBe('')
  })

  it.each(['internal_server_error', 'state_mismatch', 'MISSING_FIELD'])(
    'shows a persistent alert and retry link for %s',
    error => {
      navigation.query = `error=${error}&from=%2Fprofile`
      const html = renderToStaticMarkup(createElement(AuthErrorAlert))
      expect(html).toContain('role="alert"')
      expect(html).toContain('La connexion n’a pas abouti.')
      expect(html).toContain('Réessayer la connexion')
      expect(html).toContain('/login?from=%2Fprofile')
    },
  )

  it('does not expose raw backend error details', () => {
    navigation.query = 'error=private_database_error'
    const html = renderToStaticMarkup(createElement(AuthErrorAlert))
    expect(html).toContain('La connexion avec Discord a échoué.')
    expect(html).not.toContain('private_database_error')
  })
})
