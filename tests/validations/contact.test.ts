/**
 * File: tests/validations/contact.test.ts
 * Description: Unit tests for the contact form Zod schema.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { describe, expect, it } from 'vitest'
import { VALIDATION_LIMITS } from '@/lib/config/constants'
import { contactSchema } from '@/lib/validations/contact'

const validInput = {
  fullName: 'Jean Dupont',
  email: 'jean@exemple.ch',
  phone: '+41 79 123 45 67',
  subject: 'question' as const,
  message: 'Bonjour, je souhaite en savoir plus sur vos tournois.',
}

describe('contactSchema', () => {
  it('accepts valid complete input', () => {
    const result = contactSchema.safeParse(validInput)
    expect(result.success).toBe(true)
  })

  it('accepts valid input without phone', () => {
    const { phone: _, ...withoutPhone } = validInput
    const result = contactSchema.safeParse(withoutPhone)
    expect(result.success).toBe(true)
  })

  it('accepts empty string for phone', () => {
    const result = contactSchema.safeParse({ ...validInput, phone: '' })
    expect(result.success).toBe(true)
  })

  it('trims whitespace from fullName', () => {
    const result = contactSchema.safeParse({
      ...validInput,
      fullName: '  Jean Dupont  ',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.fullName).toBe('Jean Dupont')
    }
  })

  it('trims whitespace from message', () => {
    const result = contactSchema.safeParse({
      ...validInput,
      message: '  Un message avec des espaces.  ',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.message).toBe('Un message avec des espaces.')
    }
  })

  it('rejects missing fullName', () => {
    const { fullName: _, ...data } = validInput
    const result = contactSchema.safeParse(data)
    expect(result.success).toBe(false)
  })

  it('rejects fullName too short', () => {
    const result = contactSchema.safeParse({ ...validInput, fullName: 'A' })
    expect(result.success).toBe(false)
  })

  it('rejects fullName too long', () => {
    const result = contactSchema.safeParse({
      ...validInput,
      fullName: 'A'.repeat(VALIDATION_LIMITS.CONTACT_NAME_MAX + 1),
    })
    expect(result.success).toBe(false)
  })

  it('rejects missing email', () => {
    const { email: _, ...data } = validInput
    const result = contactSchema.safeParse(data)
    expect(result.success).toBe(false)
  })

  it('rejects invalid email format', () => {
    const result = contactSchema.safeParse({
      ...validInput,
      email: 'not-an-email',
    })
    expect(result.success).toBe(false)
  })

  it('rejects phone too long', () => {
    const result = contactSchema.safeParse({
      ...validInput,
      phone: '0'.repeat(VALIDATION_LIMITS.CONTACT_PHONE_MAX + 1),
    })
    expect(result.success).toBe(false)
  })

  it('rejects missing subject', () => {
    const { subject: _, ...data } = validInput
    const result = contactSchema.safeParse(data)
    expect(result.success).toBe(false)
  })

  it('rejects invalid subject value', () => {
    const result = contactSchema.safeParse({
      ...validInput,
      subject: 'invalid-subject',
    })
    expect(result.success).toBe(false)
  })

  it('accepts all valid subject values', () => {
    for (const subject of [
      'sponsoring',
      'inscription',
      'bug',
      'feedback',
      'question',
      'autre',
    ]) {
      const result = contactSchema.safeParse({ ...validInput, subject })
      expect(result.success).toBe(true)
    }
  })

  it('rejects missing message', () => {
    const { message: _, ...data } = validInput
    const result = contactSchema.safeParse(data)
    expect(result.success).toBe(false)
  })

  it('rejects message too short', () => {
    const result = contactSchema.safeParse({ ...validInput, message: 'Court' })
    expect(result.success).toBe(false)
  })

  it('rejects message too long', () => {
    const result = contactSchema.safeParse({
      ...validInput,
      message: 'A'.repeat(VALIDATION_LIMITS.CONTACT_MESSAGE_MAX + 1),
    })
    expect(result.success).toBe(false)
  })
})
