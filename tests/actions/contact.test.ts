/**
 * File: tests/actions/contact.test.ts
 * Description: Unit tests for the sendContactMessage server action.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'

// ---------------------------------------------------------------------------
// Mocks — must cover transitive imports from safe-action.ts -> auth -> env
// ---------------------------------------------------------------------------

vi.mock('server-only', () => ({}))

vi.mock('@/lib/core/auth', () => ({
  default: {
    api: { getSession: vi.fn() },
  },
}))

vi.mock('next/headers', () => ({
  headers: vi.fn().mockResolvedValue(new Headers()),
}))

vi.mock('@/lib/core/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))

const mockSend = vi.fn()
vi.mock('@/lib/core/resend', () => ({
  getResend: () => ({ emails: { send: mockSend } }),
}))

// ---------------------------------------------------------------------------
// Module under test
// ---------------------------------------------------------------------------

const { sendContactMessage } = await import('@/lib/actions/contact')

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const validInput = {
  fullName: 'Jean Dupont',
  email: 'jean@exemple.ch',
  phone: '+41 79 123 45 67',
  subject: 'question' as const,
  message: 'Bonjour, je souhaite en savoir plus sur vos tournois.',
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('sendContactMessage', () => {
  beforeEach(() => vi.clearAllMocks())

  it('sends email and returns success when Resend succeeds', async () => {
    mockSend.mockResolvedValue({ data: { id: 'msg-1' }, error: null })

    const result = await sendContactMessage(validInput)

    expect(result.success).toBe(true)
    expect(result.message).toBe('Votre message a été envoyé avec succès.')
    expect(mockSend).toHaveBeenCalledOnce()
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'belougatournament@gmail.com',
        replyTo: 'jean@exemple.ch',
        subject: expect.stringContaining('Jean Dupont'),
      }),
    )
  })

  it('returns error when Resend fails', async () => {
    mockSend.mockResolvedValue({
      data: null,
      error: { message: 'Rate limit exceeded' },
    })

    const result = await sendContactMessage(validInput)

    expect(result.success).toBe(false)
    expect(result.message).toContain('erreur')
  })

  it('returns validation errors for invalid input', async () => {
    const result = await sendContactMessage({
      fullName: '',
      email: 'not-an-email',
      subject: 'invalid' as 'question',
      message: '',
    })

    expect(result.success).toBe(false)
    expect(result.message).toBe('Validation error')
    expect(result.errors).toBeDefined()
  })

  it('includes subject label in email subject line', async () => {
    mockSend.mockResolvedValue({ data: { id: 'msg-2' }, error: null })

    await sendContactMessage({ ...validInput, subject: 'sponsoring' })

    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: expect.stringContaining('Sponsoring'),
      }),
    )
  })
})
