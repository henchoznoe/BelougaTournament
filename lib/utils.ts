/**
 * File: lib/utils.ts
 * Description: Utility functions for class name merging.
 * Author: Noé Henchoz
 * Date: 2025-12-02
 * License: MIT
 */

import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export const cn = (...inputs: ClassValue[]) => {
  return twMerge(clsx(inputs))
}

/**
 * Formats a date to a localized string.
 * @param date - The date to format (Date object or string/number compatible with Date constructor).
 * @param options - Intl.DateTimeFormatOptions to customize the output.
 * @returns The formatted date string.
 */
export function formatDate(
  date: Date | string | number,
  options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  },
) {
  const d = new Date(date)
  return d.toLocaleDateString('fr-FR', options)
}
