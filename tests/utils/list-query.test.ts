/**
 * File: tests/utils/list-query.test.ts
 * Description: Regression tests for resilient, persistent list controls.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { describe, expect, it } from 'vitest'
import { parseListPage, updateListQuery } from '@/lib/utils/list-query'

describe('list URL state', () => {
  it.each([
    null,
    '',
    'NaN',
    '-2',
    '0',
    '1.5',
    'Infinity',
    '999999999999999999999999',
  ])('falls back for invalid page %s', value => {
    expect(parseListPage(value)).toBe(1)
  })
  it('accepts a positive page', () => expect(parseListPage('3')).toBe(3))
  it('preserves filters and the anchor when changing pages', () => {
    expect(
      updateListQuery(
        'https://example.test/admin/tournaments?search=overwatch&status=PUBLISHED#list',
        'page',
        '2',
        '1',
      ),
    ).toBe('/admin/tournaments?search=overwatch&status=PUBLISHED&page=2#list')
  })
  it('resets pagination while changing filters without losing sort', () => {
    expect(
      updateListQuery(
        'https://example.test/admin/users?page=3&sort=user%3Adesc',
        'search',
        'Noé',
        '',
        true,
      ),
    ).toBe('/admin/users?sort=user%3Adesc&search=No%C3%A9')
  })
  it('removes a default value from the URL', () => {
    expect(
      updateListQuery(
        'https://example.test/admin/sponsors?status=enabled&page=2',
        'status',
        'all',
        'all',
        true,
      ),
    ).toBe('/admin/sponsors')
  })
})
