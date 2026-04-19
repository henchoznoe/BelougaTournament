/**
 * File: components/admin/lists/use-list-sort.ts
 * Description: Shared sort state hook, sort helper, and SortIndicator component for admin list tables.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { ChevronDown, ChevronUp } from 'lucide-react'
import { createElement, type ReactNode, useCallback, useState } from 'react'

type SortDirection = 'asc' | 'desc'

interface SortState<K extends string> {
  key: K | null
  direction: SortDirection
}

/**
 * Generic 3-state sort toggle: unsorted → asc → desc → unsorted.
 * Resets page via the provided callback.
 */
export const useListSort = <K extends string>(resetPage?: () => void) => {
  const [sort, setSort] = useState<SortState<K>>({
    key: null,
    direction: 'asc',
  })

  const handleSort = useCallback(
    (key: K) => {
      setSort(prev => {
        if (prev.key !== key) return { key, direction: 'asc' }
        if (prev.direction === 'asc') return { key, direction: 'desc' }
        return { key: null, direction: 'asc' }
      })
      resetPage?.()
    },
    [resetPage],
  )

  /** Renders a chevron icon when the given column is actively sorted. */
  const sortIndicator = (columnKey: K): ReactNode => {
    if (sort.key !== columnKey) return null
    return createElement(sort.direction === 'asc' ? ChevronUp : ChevronDown, {
      className: 'inline size-3',
    })
  }

  return { sort, handleSort, sortIndicator } as const
}

/**
 * Generic sort helper: applies sort state to a pre-filtered array.
 * Falls back to `defaultSort` when no column is actively sorted.
 */
export const applySortToList = <T, K extends string>(
  items: T[],
  sort: SortState<K>,
  compareValues: (a: T, b: T, key: K) => number,
  defaultSort: (a: T, b: T) => number,
): T[] => {
  const sorted = [...items]
  if (sort.key) {
    const key = sort.key
    const dir = sort.direction === 'asc' ? 1 : -1
    sorted.sort((a, b) => compareValues(a, b, key) * dir)
  } else {
    sorted.sort(defaultSort)
  }
  return sorted
}
