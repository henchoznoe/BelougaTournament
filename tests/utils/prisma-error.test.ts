/**
 * File: tests/utils/prisma-error.test.ts
 * Description: Unit tests for the Prisma error handler utility.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { describe, expect, it } from 'vitest'
import { handlePrismaError } from '@/lib/utils/prisma-error'
import { Prisma } from '@/prisma/generated/prisma/client'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const makeKnownError = (code: string) =>
  new Prisma.PrismaClientKnownRequestError('message', {
    code,
    clientVersion: '7.0.0',
  })

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('handlePrismaError', () => {
  it('returns null for a plain Error (not Prisma)', () => {
    expect(handlePrismaError(new Error('Generic error'))).toBeNull()
  })

  it('returns null for non-error values', () => {
    expect(handlePrismaError('some string')).toBeNull()
    expect(handlePrismaError(null)).toBeNull()
    expect(handlePrismaError(undefined)).toBeNull()
  })

  it('handles P2002 (unique constraint)', () => {
    expect(handlePrismaError(makeKnownError('P2002'))).toEqual({
      success: false,
      message: 'Cette valeur existe déjà.',
    })
  })

  it('handles P2025 (record not found)', () => {
    expect(handlePrismaError(makeKnownError('P2025'))).toEqual({
      success: false,
      message: 'Enregistrement introuvable.',
    })
  })

  it('handles P2003 (foreign key violation)', () => {
    expect(handlePrismaError(makeKnownError('P2003'))).toEqual({
      success: false,
      message: 'Un enregistrement lié est introuvable.',
    })
  })

  it('handles P2000 (value too long)', () => {
    expect(handlePrismaError(makeKnownError('P2000'))).toEqual({
      success: false,
      message: 'La valeur fournie est trop longue.',
    })
  })

  it('returns generic message for unknown Prisma codes', () => {
    expect(handlePrismaError(makeKnownError('P9999'))).toEqual({
      success: false,
      message: 'Une erreur inattendue est survenue. Veuillez réessayer.',
    })
  })

  it('handles PrismaClientUnknownRequestError', () => {
    const error = new Prisma.PrismaClientUnknownRequestError('unknown', {
      clientVersion: '7.0.0',
    })
    expect(handlePrismaError(error)).toEqual({
      success: false,
      message: 'Une erreur inattendue est survenue. Veuillez réessayer.',
    })
  })
})
