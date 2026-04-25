/**
 * File: tests/utils/contact-email.test.ts
 * Description: Unit tests for the contact email HTML builder.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { describe, expect, it } from 'vitest'
import { buildContactEmailHtml } from '@/lib/utils/contact-email'
import type { ContactInput } from '@/lib/validations/contact'

const baseInput: ContactInput = {
  fullName: 'Jean Dupont',
  email: 'jean@exemple.ch',
  phone: '+41 79 123 45 67',
  subject: 'question',
  message: 'Bonjour, je souhaite en savoir plus.',
}

describe('buildContactEmailHtml', () => {
  it('includes all fields in the output', () => {
    const html = buildContactEmailHtml(baseInput)

    expect(html).toContain('Jean Dupont')
    expect(html).toContain('jean@exemple.ch')
    expect(html).toContain('+41 79 123 45 67')
    expect(html).toContain('Question générale')
    expect(html).toContain('Bonjour, je souhaite en savoir plus.')
  })

  it('includes phone row when phone is provided', () => {
    const html = buildContactEmailHtml(baseInput)

    expect(html).toContain('Téléphone')
    expect(html).toContain('+41 79 123 45 67')
  })

  it('omits phone row when phone is empty', () => {
    const html = buildContactEmailHtml({ ...baseInput, phone: '' })

    expect(html).not.toContain('Téléphone')
  })

  it('omits phone row when phone is undefined', () => {
    const { phone: _, ...withoutPhone } = baseInput
    const html = buildContactEmailHtml(withoutPhone as ContactInput)

    expect(html).not.toContain('Téléphone')
  })

  it('resolves known subject values to labels', () => {
    const html = buildContactEmailHtml({ ...baseInput, subject: 'sponsoring' })
    expect(html).toContain('Sponsoring')
  })

  it('falls back to raw value for unknown subject', () => {
    const html = buildContactEmailHtml({
      ...baseInput,
      subject: 'unknown-value' as ContactInput['subject'],
    })
    expect(html).toContain('unknown-value')
  })

  it('escapes HTML special characters in fullName', () => {
    const html = buildContactEmailHtml({
      ...baseInput,
      fullName: '<script>alert("xss")</script>',
    })

    expect(html).toContain('&lt;script&gt;')
    expect(html).toContain('alert(&quot;xss&quot;)')
    expect(html).not.toContain('<script>')
  })

  it('escapes ampersands in message', () => {
    const html = buildContactEmailHtml({
      ...baseInput,
      message: 'Tom & Jerry are here',
    })

    expect(html).toContain('Tom &amp; Jerry are here')
  })

  it('converts newlines in message to <br />', () => {
    const html = buildContactEmailHtml({
      ...baseInput,
      message: 'Ligne 1\nLigne 2\nLigne 3',
    })

    expect(html).toContain('Ligne 1<br />Ligne 2<br />Ligne 3')
  })
})
