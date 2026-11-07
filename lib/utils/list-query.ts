/**
 * File: lib/utils/list-query.ts
 * Description: Safe URL updates and pagination parsing for client-side lists.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

export const parseListPage = (value: string | null): number => {
  const page = Number(value)
  return Number.isSafeInteger(page) && page > 0 ? page : 1
}

export const updateListQuery = (
  url: string,
  key: string,
  value: string,
  defaultValue = '',
  resetPage = false,
): string => {
  const next = new URL(url)
  if (value === defaultValue) next.searchParams.delete(key)
  else next.searchParams.set(key, value)
  if (resetPage) next.searchParams.delete('page')
  return `${next.pathname}${next.search}${next.hash}`
}
