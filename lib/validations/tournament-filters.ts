/**
 * File: lib/validations/tournament-filters.ts
 * Description: Types, constants, and parser for public tournament list URL filter parameters.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { VALIDATION_LIMITS } from '@/lib/config/constants'
import {
  RegistrationType,
  TournamentFormat,
} from '@/prisma/generated/prisma/enums'

/** Sort options for the public tournament list pages. */
export type TournamentSortOption =
  | 'date_asc'
  | 'date_desc'
  | 'title_asc'
  | 'title_desc'
  | 'registrations_desc'

/** All valid values for the sort option — used for runtime type-guarding. */
export const VALID_SORT_OPTIONS: TournamentSortOption[] = [
  'date_asc',
  'date_desc',
  'title_asc',
  'title_desc',
  'registrations_desc',
] as const

/** Parsed and validated filters for the public tournament list pages. */
export type PublicTournamentFilters = {
  search: string
  format: TournamentFormat | ''
  type: 'FREE' | 'PAID' | ''
  sort: TournamentSortOption
  page: number
}

/** Parse and validate URL search params for the public tournament list pages.
 *  Falls back to safe defaults for any invalid/missing value. */
export const parsePublicTournamentFilters = (
  params: Record<string, string | string[] | undefined>,
  defaultSort: TournamentSortOption = 'date_asc',
): PublicTournamentFilters => {
  const raw = (key: string) => {
    const v = params[key]
    return typeof v === 'string' ? v.trim() : ''
  }

  const search = raw('search').slice(0, VALIDATION_LIMITS.SEARCH_QUERY_MAX)

  const formatRaw = raw('format')
  const format: TournamentFormat | '' =
    formatRaw === TournamentFormat.SOLO || formatRaw === TournamentFormat.TEAM
      ? formatRaw
      : ''

  const typeRaw = raw('type')
  const type: 'FREE' | 'PAID' | '' =
    typeRaw === RegistrationType.FREE || typeRaw === RegistrationType.PAID
      ? typeRaw
      : ''

  const sortRaw = raw('sort')
  const sort: TournamentSortOption = (
    VALID_SORT_OPTIONS.includes(sortRaw as TournamentSortOption)
      ? sortRaw
      : defaultSort
  ) as TournamentSortOption

  const pageRaw = Number.parseInt(raw('page'), 10)
  const page = Number.isFinite(pageRaw) && pageRaw >= 1 ? pageRaw : 1

  return { search, format, type, sort, page }
}
