/**
 * File: tests/validations/shared.test.ts
 * Description: Unit tests for shared Zod validation utilities.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { describe, expect, it } from 'vitest'
import { optionalUrl } from '@/lib/validations/shared'

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('optionalUrl', () => {
  it('accepts an empty string (field cleared)', () => {
    const result = optionalUrl.safeParse('')
    expect(result.success).toBe(true)
  })

  it('accepts a whitespace-only string (trims to empty)', () => {
    const result = optionalUrl.safeParse('   ')
    expect(result.success).toBe(true)
  })

  it('accepts a valid https URL', () => {
    const result = optionalUrl.safeParse('https://example.com')
    expect(result.success).toBe(true)
  })

  it('accepts a valid http URL', () => {
    const result = optionalUrl.safeParse('http://example.com')
    expect(result.success).toBe(true)
  })

  it('accepts a URL with a path', () => {
    const result = optionalUrl.safeParse('https://example.com/path/to/resource')
    expect(result.success).toBe(true)
  })

  it('rejects a plain string (no protocol)', () => {
    const result = optionalUrl.safeParse('example.com')
    expect(result.success).toBe(false)
  })

  it('rejects a string with only the protocol', () => {
    const result = optionalUrl.safeParse('https://')
    expect(result.success).toBe(false)
  })

  it('rejects ftp:// protocol', () => {
    const result = optionalUrl.safeParse('ftp://files.example.com')
    expect(result.success).toBe(false)
  })

  it('trims whitespace before validation', () => {
    const result = optionalUrl.safeParse('  https://example.com  ')
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toBe('https://example.com')
    }
  })
})
