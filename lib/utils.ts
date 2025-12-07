/**
 * File: lib/utils.ts
 * Description: Utility functions for class name merging and date formatting.
 * Author: Noé Henchoz
 * Date: 2025-12-07
 * License: MIT
 */

import { type ClassValue, clsx } from 'clsx'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { twMerge } from 'tailwind-merge'

export const cn = (...inputs: ClassValue[]) => {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string | number) {
  return format(new Date(date), 'PPP', { locale: fr })
}

export function formatDateTime(date: Date | string | number) {
  return format(new Date(date), "PPP 'à' p", { locale: fr })
}

export function getErrorMessage(error: unknown, fallback: string): string {
  console.error(error)
  if (error instanceof Error) {
    return error.message
  }
  return fallback
}
