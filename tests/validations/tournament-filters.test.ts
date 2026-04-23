/**
 * File: tests/validations/tournament-filters.test.ts
 * Description: Unit tests for public tournament filter parsing helpers.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { describe, expect, it } from 'vitest'
import { VALIDATION_LIMITS } from '@/lib/config/constants'
import {
  parsePublicTournamentFilters,
  VALID_SORT_OPTIONS,
} from '@/lib/validations/tournament-filters'
import {
  RegistrationType,
  TournamentFormat,
} from '@/prisma/generated/prisma/enums'

const LONG_SEARCH_VALUE = 'x'.repeat(VALIDATION_LIMITS.SEARCH_QUERY_MAX + 10)
const DEFAULT_SORT = 'title_desc' as const

describe('VALID_SORT_OPTIONS', () => {
  it('contains every supported sort option', () => {
    expect(VALID_SORT_OPTIONS).toEqual([
      'date_asc',
      'date_desc',
      'title_asc',
      'title_desc',
      'registrations_desc',
    ])
  })
})

describe('parsePublicTournamentFilters', () => {
  it('returns safe defaults when params are missing', () => {
    expect(parsePublicTournamentFilters({})).toEqual({
      search: '',
      format: '',
      type: '',
      sort: 'date_asc',
      page: 1,
    })
  })

  it('trims and truncates the search query', () => {
    const result = parsePublicTournamentFilters({
      search: `  ${LONG_SEARCH_VALUE}  `,
    })

    expect(result.search).toHaveLength(VALIDATION_LIMITS.SEARCH_QUERY_MAX)
    expect(result.search).toBe(
      LONG_SEARCH_VALUE.slice(0, VALIDATION_LIMITS.SEARCH_QUERY_MAX),
    )
  })

  it('accepts SOLO and TEAM format filters', () => {
    expect(
      parsePublicTournamentFilters({ format: TournamentFormat.SOLO }).format,
    ).toBe(TournamentFormat.SOLO)
    expect(
      parsePublicTournamentFilters({ format: TournamentFormat.TEAM }).format,
    ).toBe(TournamentFormat.TEAM)
  })

  it('falls back to an empty format for invalid or array values', () => {
    expect(parsePublicTournamentFilters({ format: 'DUO' }).format).toBe('')
    expect(
      parsePublicTournamentFilters({ format: [TournamentFormat.SOLO] }).format,
    ).toBe('')
  })

  it('accepts FREE and PAID type filters', () => {
    expect(
      parsePublicTournamentFilters({ type: RegistrationType.FREE }).type,
    ).toBe(RegistrationType.FREE)
    expect(
      parsePublicTournamentFilters({ type: RegistrationType.PAID }).type,
    ).toBe(RegistrationType.PAID)
  })

  it('falls back to an empty type for invalid values', () => {
    expect(parsePublicTournamentFilters({ type: 'INVITE' }).type).toBe('')
  })

  it('keeps valid sort values and falls back to the provided default sort otherwise', () => {
    expect(
      parsePublicTournamentFilters({ sort: 'registrations_desc' }).sort,
    ).toBe('registrations_desc')
    expect(
      parsePublicTournamentFilters({ sort: 'unknown' }, DEFAULT_SORT).sort,
    ).toBe(DEFAULT_SORT)
  })

  it('parses positive page numbers and falls back to 1 for invalid values', () => {
    expect(parsePublicTournamentFilters({ page: '3' }).page).toBe(3)
    expect(parsePublicTournamentFilters({ page: '0' }).page).toBe(1)
    expect(parsePublicTournamentFilters({ page: '-2' }).page).toBe(1)
    expect(parsePublicTournamentFilters({ page: 'NaN' }).page).toBe(1)
    expect(parsePublicTournamentFilters({ page: ['4'] }).page).toBe(1)
  })
})
