/**
 * File: components/admin/ui/admin-pagination.tsx
 * Description: Shared pagination controls for admin list pages.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface AdminPaginationProps {
  /** Current page (1-based). */
  page: number
  /** Total number of pages. */
  totalPages: number
  /** Go to previous page. */
  onPrev: () => void
  /** Go to next page. */
  onNext: () => void
  /** 1-based start of the visible range. */
  rangeStart?: number
  /** 1-based end of the visible range. */
  rangeEnd?: number
  /** Total item count (used for range display). */
  total?: number
}

/**
 * Renders pagination controls with chevron icon buttons.
 * When `rangeStart`, `rangeEnd`, and `total` are provided, the left side
 * shows an item range (e.g. "1–10 sur 50"). Otherwise it shows "Page X sur Y".
 * Only renders when `totalPages > 1`.
 */
export const AdminPagination = ({
  page,
  totalPages,
  onPrev,
  onNext,
  rangeStart,
  rangeEnd,
  total,
}: AdminPaginationProps) => {
  if (totalPages <= 1) return null

  const showRange =
    rangeStart !== undefined && rangeEnd !== undefined && total !== undefined

  return (
    <div className="flex items-center justify-between">
      <p className="text-xs text-zinc-500">
        {showRange ? (
          <>
            {rangeStart}&ndash;{rangeEnd} sur {total}
          </>
        ) : (
          <>
            Page {page} sur {totalPages}
          </>
        )}
      </p>
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon-sm"
          disabled={page <= 1}
          onClick={onPrev}
          aria-label="Page précédente"
          className="text-zinc-400"
        >
          <ChevronLeft className="size-4" />
        </Button>
        <span className="px-2 text-xs text-zinc-400">
          {page} / {totalPages}
        </span>
        <Button
          variant="ghost"
          size="icon-sm"
          disabled={page >= totalPages}
          onClick={onNext}
          aria-label="Page suivante"
          className="text-zinc-400"
        >
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  )
}
