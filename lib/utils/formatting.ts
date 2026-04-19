/**
 * File: lib/utils/formatting.ts
 * Description: Utility functions for date formatting and data normalization.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

export const formatDate = (date: Date | string | number) => {
  return format(new Date(date), 'PPP', { locale: fr })
}

export const formatDateTime = (date: Date | string | number) => {
  return format(new Date(date), "PPP 'à' p", { locale: fr })
}

export const formatShortDate = (date: Date | string | number) => {
  return format(new Date(date), 'dd.MM.yyyy')
}

/** Converts empty strings or undefined to null for nullable Prisma fields. */
export const toNullable = (val: string | undefined): string | null =>
  val === '' || val === undefined ? null : val

/** Converts null to empty string for form default values. */
export const fromNullable = (val: string | null): string => val ?? ''

/** Strips HTML tags to produce plain text suitable for previews. */
export const stripHtml = (text: string): string =>
  text
    .replace(/<br\s*\/?>/gi, ' ') // line breaks to spaces
    .replace(/<\/(?:p|div|li|h[1-6]|blockquote)>/gi, ' ') // block-level closing tags to spaces
    .replace(/<[^>]*>/g, '') // strip all remaining HTML tags
    .replace(/&nbsp;/g, ' ') // non-breaking spaces
    .replace(/&amp;/g, '&') // ampersands
    .replace(/&lt;/g, '<') // less-than
    .replace(/&gt;/g, '>') // greater-than
    .replace(/&quot;/g, '"') // quotes
    .replace(/&#39;/g, "'") // single quotes
    .replace(/\s{2,}/g, ' ') // collapse whitespace
    .trim()
