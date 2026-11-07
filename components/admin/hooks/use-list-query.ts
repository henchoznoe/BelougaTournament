/**
 * File: components/admin/hooks/use-list-query.ts
 * Description: URL-backed list controls using Next.js integrated native history.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

'use client'

import { useSearchParams } from 'next/navigation'
import { useCallback } from 'react'
import { updateListQuery } from '@/lib/utils/list-query'

export const useListQuery = <T extends string>(
  key: string,
  defaultValue: T,
  validate?: (value: string) => value is T,
) => {
  const params = useSearchParams()
  const raw = params.get(key)
  const value =
    raw !== null && (!validate || validate(raw)) ? (raw as T) : defaultValue
  const setValue = useCallback(
    (next: T, resetPage = true) => {
      window.history.replaceState(
        null,
        '',
        updateListQuery(
          window.location.href,
          key,
          next,
          defaultValue,
          resetPage,
        ),
      )
    },
    [key, defaultValue],
  )
  return [value, setValue] as const
}
