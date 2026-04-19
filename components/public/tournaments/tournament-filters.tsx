/**
 * File: components/public/tournaments/tournament-filters.tsx
 * Description: Client-side toolbar for filtering and sorting the public tournament list pages via URL search params.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

'use client'

import { Search, SlidersHorizontal, X } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type {
  PublicTournamentFilters,
  TournamentSortOption,
} from '@/lib/validations/tournaments'
import { VALID_SORT_OPTIONS } from '@/lib/validations/tournaments'
import {
  RegistrationType,
  TournamentFormat,
} from '@/prisma/generated/prisma/enums'

interface TournamentFiltersProps {
  filters: PublicTournamentFilters
  basePath: string
}

const isTournamentSortOption = (val: string): val is TournamentSortOption =>
  VALID_SORT_OPTIONS.includes(val as TournamentSortOption)

const SEARCH_DEBOUNCE_MS = 350

/** Builds a new URLSearchParams string, resetting page to 1 on filter change. */
const buildQuery = (
  current: PublicTournamentFilters,
  overrides: Partial<PublicTournamentFilters>,
): string => {
  const next = { ...current, ...overrides, page: 1 }
  const params = new URLSearchParams()
  if (next.search) params.set('search', next.search)
  if (next.format) params.set('format', next.format)
  if (next.type) params.set('type', next.type)
  if (next.sort) params.set('sort', next.sort)
  const qs = params.toString()
  return qs ? `?${qs}` : ''
}

export const TournamentFilters = ({
  filters,
  basePath,
}: TournamentFiltersProps) => {
  const router = useRouter()
  useSearchParams() // ensure component re-renders on param changes

  const [searchValue, setSearchValue] = useState(filters.search)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Sync local search state if filters change (e.g. browser back/forward)
  useEffect(() => {
    setSearchValue(filters.search)
  }, [filters.search])

  const navigate = useCallback(
    (overrides: Partial<PublicTournamentFilters>) => {
      router.push(`${basePath}${buildQuery(filters, overrides)}`, {
        scroll: false,
      })
    },
    [router, basePath, filters],
  )

  const handleSearch = (value: string) => {
    setSearchValue(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      navigate({ search: value })
    }, SEARCH_DEBOUNCE_MS)
  }

  const hasActiveFilters =
    filters.search !== '' || filters.format !== '' || filters.type !== ''

  const handleReset = () => {
    setSearchValue('')
    router.push(basePath, { scroll: false })
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap">
      {/* Search input */}
      <div className="relative flex-1 min-w-48">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-500" />
        <Input
          value={searchValue}
          onChange={e => handleSearch(e.target.value)}
          placeholder="Rechercher un tournoi ou un jeu…"
          aria-label="Rechercher un tournoi"
          className="h-10 rounded-xl border-white/10 bg-white/5 pl-9 text-sm text-zinc-200 placeholder:text-zinc-600 focus-visible:border-blue-500/30 focus-visible:ring-blue-500/20"
        />
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {/* Format filter */}
        <Select
          value={filters.format || 'all'}
          onValueChange={value => {
            if (value === 'all') {
              navigate({ format: '' })
            } else if (
              value === TournamentFormat.SOLO ||
              value === TournamentFormat.TEAM
            ) {
              navigate({ format: value })
            }
          }}
        >
          <SelectTrigger
            aria-label="Filtrer par format"
            className="h-10 w-36 rounded-xl border-white/10 bg-white/5 text-sm text-zinc-300"
          >
            <SlidersHorizontal className="mr-1.5 size-3.5 text-zinc-500" />
            <SelectValue placeholder="Format" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les formats</SelectItem>
            <SelectItem value={TournamentFormat.SOLO}>Solo</SelectItem>
            <SelectItem value={TournamentFormat.TEAM}>Équipe</SelectItem>
          </SelectContent>
        </Select>

        {/* Type filter */}
        <Select
          value={filters.type || 'all'}
          onValueChange={value => {
            if (value === 'all') {
              navigate({ type: '' })
            } else if (
              value === RegistrationType.FREE ||
              value === RegistrationType.PAID
            ) {
              navigate({ type: value })
            }
          }}
        >
          <SelectTrigger
            aria-label="Filtrer par type d'inscription"
            className="h-10 w-36 rounded-xl border-white/10 bg-white/5 text-sm text-zinc-300"
          >
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les types</SelectItem>
            <SelectItem value={RegistrationType.FREE}>Gratuit</SelectItem>
            <SelectItem value={RegistrationType.PAID}>Payant</SelectItem>
          </SelectContent>
        </Select>

        {/* Sort */}
        <Select
          value={filters.sort}
          onValueChange={value => {
            if (isTournamentSortOption(value)) navigate({ sort: value })
          }}
        >
          <SelectTrigger
            aria-label="Trier les tournois"
            className="h-10 w-44 rounded-xl border-white/10 bg-white/5 text-sm text-zinc-300"
          >
            <SelectValue placeholder="Trier par" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="date_asc">Date (croissante)</SelectItem>
            <SelectItem value="date_desc">Date (décroissante)</SelectItem>
            <SelectItem value="title_asc">Titre (A → Z)</SelectItem>
            <SelectItem value="title_desc">Titre (Z → A)</SelectItem>
            <SelectItem value="registrations_desc">Plus d'inscrits</SelectItem>
          </SelectContent>
        </Select>

        {/* Reset button — only shown when filters are active */}
        {hasActiveFilters && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleReset}
            aria-label="Réinitialiser les filtres"
            className="h-10 gap-1.5 rounded-xl px-3 text-xs text-zinc-400 hover:bg-white/5 hover:text-white"
          >
            <X className="size-3.5" />
            Réinitialiser
          </Button>
        )}
      </div>
    </div>
  )
}
