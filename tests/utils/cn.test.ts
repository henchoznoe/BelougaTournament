/**
 * File: tests/utils/cn.test.ts
 * Description: Unit tests for the cn class merging utility.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { describe, expect, it } from 'vitest'
import { cn } from '@/lib/utils/cn'

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('cn', () => {
  it('joins multiple class strings', () => {
    expect(cn('foo', 'bar', 'baz')).toBe('foo bar baz')
  })

  it('returns empty string when called with no arguments', () => {
    expect(cn()).toBe('')
  })

  it('filters out undefined values', () => {
    expect(cn('foo', undefined, 'bar')).toBe('foo bar')
  })

  it('filters out null values', () => {
    expect(cn('foo', null, 'bar')).toBe('foo bar')
  })

  it('handles a truthy conditional class', () => {
    expect(cn('base', true && 'active')).toBe('base active')
  })

  it('filters out a falsy conditional class', () => {
    expect(cn('base', false && 'active')).toBe('base')
  })

  it('merges conflicting Tailwind padding — last one wins', () => {
    expect(cn('p-2', 'p-4')).toBe('p-4')
  })

  it('merges conflicting text colors — last one wins', () => {
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500')
  })

  it('keeps non-conflicting classes', () => {
    expect(cn('p-4', 'text-blue-500')).toBe('p-4 text-blue-500')
  })

  it('handles clsx object syntax', () => {
    expect(cn({ 'font-bold': true, italic: false })).toBe('font-bold')
  })

  it('handles clsx array syntax', () => {
    expect(cn(['foo', 'bar'])).toBe('foo bar')
  })
})
