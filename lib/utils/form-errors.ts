/**
 * File: lib/utils/form-errors.ts
 * Description: Finds the first invalid field, including nested form-array entries.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

export const getFirstErrorPath = (
  errors: unknown,
  prefix = '',
): string | undefined => {
  if (!errors || typeof errors !== 'object') return undefined
  if ('message' in errors && typeof errors.message === 'string' && prefix)
    return prefix
  for (const [key, value] of Object.entries(errors)) {
    if (['ref', 'type', 'types', 'message', 'root'].includes(key)) continue
    const path = getFirstErrorPath(value, prefix ? `${prefix}.${key}` : key)
    if (path) return path
  }
  return undefined
}
