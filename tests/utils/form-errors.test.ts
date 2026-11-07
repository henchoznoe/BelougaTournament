/**
 * File: tests/utils/form-errors.test.ts
 * Description: Verifies focus targeting for simple fields and nested tournament editor errors.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { describe, expect, it } from 'vitest'
import { getFirstErrorPath } from '@/lib/utils/form-errors'

describe('invalid field targeting', () => {
  it('finds a normal field', () =>
    expect(getFirstErrorPath({ title: { message: 'Requis' } })).toBe('title'))
  it('finds an entry inside a dynamic field array', () =>
    expect(
      getFirstErrorPath({
        fields: [undefined, { label: { message: 'Requis' } }],
      }),
    ).toBe('fields.1.label'))
  it('does not traverse element refs or form-level errors', () => {
    const ref: { current?: unknown } = {}
    ref.current = ref
    expect(
      getFirstErrorPath({
        root: { message: 'Erreur générale' },
        ref,
        description: { message: 'Requis' },
      }),
    ).toBe('description')
  })
  it('handles a valid form', () =>
    expect(getFirstErrorPath({})).toBeUndefined())
})
