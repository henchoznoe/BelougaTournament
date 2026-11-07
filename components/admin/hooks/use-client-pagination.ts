/**
 * File: components/admin/hooks/use-client-pagination.ts
 * Description: Reusable hook for client-side list pagination with page-reset support.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { useCallback, useMemo } from 'react'
import { useListQuery } from '@/components/admin/hooks/use-list-query'
import { parseListPage } from '@/lib/utils/list-query'

interface PaginationResult<T> {
  /** Current page (1-based, clamped to valid range). */
  page: number
  /** Total number of pages (minimum 1). */
  totalPages: number
  /** Items visible on the current page. */
  paginated: T[]
  /** 1-based index of the first visible item (0 when empty). */
  rangeStart: number
  /** 1-based index of the last visible item. */
  rangeEnd: number
  /** Total number of items. */
  total: number
  /** Whether the previous-page button should be disabled. */
  hasPrev: boolean
  /** Whether the next-page button should be disabled. */
  hasNext: boolean
  /** Go to the previous page. */
  prevPage: () => void
  /** Go to the next page. */
  nextPage: () => void
  /** Reset to page 1 — stable callback, safe for useListSort / filter handlers. */
  resetPage: () => void
}

/**
 * Client-side pagination for filtered/sorted admin lists.
 *
 * Call the hook first (before `useListSort`) so that `resetPage` is available
 * to pass as the sort-reset callback. Then call `paginate(items)` after the
 * filtered/sorted array is computed.
 *
 * @example
 * const { paginate, resetPage } = useClientPagination<Item>(PAGE_SIZE)
 * const { sort, handleSort } = useListSort<SortKey>(resetPage)
 * const filtered = useMemo(() => …, [sort, …])
 * const { page, paginated, … } = paginate(filtered)
 */
export const useClientPagination = <T>(
  pageSize: number,
): {
  resetPage: () => void
  paginate: (items: T[]) => PaginationResult<T>
} => {
  const [rawPage, setPage] = useListQuery<string>('page', '1')
  const page = parseListPage(rawPage)
  const resetPage = useCallback(() => setPage('1', false), [setPage])

  const paginate = useMemo(
    () =>
      (items: T[]): PaginationResult<T> => {
        const totalPages = Math.max(1, Math.ceil(items.length / pageSize))
        const safePage = Math.min(page, totalPages)
        const start = (safePage - 1) * pageSize
        const paginated = items.slice(start, start + pageSize)

        return {
          page: safePage,
          totalPages,
          paginated,
          rangeStart: items.length === 0 ? 0 : start + 1,
          rangeEnd: Math.min(safePage * pageSize, items.length),
          total: items.length,
          hasPrev: safePage > 1,
          hasNext: safePage < totalPages,
          prevPage: () => setPage(String(Math.max(1, safePage - 1)), false),
          nextPage: () =>
            setPage(String(Math.min(totalPages, safePage + 1)), false),
          resetPage,
        }
      },
    [page, pageSize, setPage, resetPage],
  )

  return { resetPage, paginate }
}
