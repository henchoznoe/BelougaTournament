/**
 * File: components/public/tournaments/tournament-pagination.tsx
 * Description: Prev/Next pagination controls for the public tournament list pages using URL search params.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import type { PublicTournamentFilters } from '@/lib/validations/tournaments'

interface TournamentPaginationProps {
  total: number
  page: number
  pageSize: number
  totalPages: number
  basePath: string
  filters: PublicTournamentFilters
}

/** Builds a URL with updated page param while preserving other filters. */
const buildPageUrl = (
  basePath: string,
  filters: PublicTournamentFilters,
  targetPage: number,
): string => {
  const params = new URLSearchParams()
  if (filters.search) params.set('search', filters.search)
  if (filters.format) params.set('format', filters.format)
  if (filters.type) params.set('type', filters.type)
  if (filters.sort) params.set('sort', filters.sort)
  params.set('page', String(targetPage))
  return `${basePath}?${params.toString()}`
}

export const TournamentPagination = ({
  total,
  page,
  pageSize,
  totalPages,
  basePath,
  filters,
}: TournamentPaginationProps) => {
  const router = useRouter()

  if (totalPages <= 1) return null

  const from = (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)

  const goTo = (targetPage: number) => {
    router.push(buildPageUrl(basePath, filters, targetPage), { scroll: true })
  }

  return (
    <div className="flex items-center justify-between gap-4">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        disabled={page <= 1}
        onClick={() => goTo(page - 1)}
        aria-label="Page précédente"
        className="h-10 gap-1.5 rounded-xl border border-white/5 bg-white/3 px-4 text-sm text-zinc-400 hover:bg-white/5 hover:text-white disabled:opacity-40"
      >
        <ChevronLeft className="size-4" />
        Précédent
      </Button>

      <span className="text-sm text-zinc-500">
        <span className="text-zinc-300">
          {from}–{to}
        </span>{' '}
        sur <span className="text-zinc-300">{total}</span>
        <span className="ml-3 text-zinc-600">
          Page {page} / {totalPages}
        </span>
      </span>

      <Button
        type="button"
        variant="ghost"
        size="sm"
        disabled={page >= totalPages}
        onClick={() => goTo(page + 1)}
        aria-label="Page suivante"
        className="h-10 gap-1.5 rounded-xl border border-white/5 bg-white/3 px-4 text-sm text-zinc-400 hover:bg-white/5 hover:text-white disabled:opacity-40"
      >
        Suivant
        <ChevronRight className="size-4" />
      </Button>
    </div>
  )
}
