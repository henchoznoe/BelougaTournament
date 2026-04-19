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

/** Strips Markdown syntax to produce plain text suitable for previews. */
export const stripMarkdown = (text: string): string =>
  text
    .replace(/^#{1,6}\s+/gm, '') // headings
    .replace(/(\*{1,3}|_{1,3})(.*?)\1/g, '$2') // bold/italic
    .replace(/~~(.*?)~~/g, '$1') // strikethrough
    .replace(/`{1,3}[^`]*`{1,3}/g, '') // inline/block code
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1') // links
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1') // images
    .replace(/^[\s]*[-*+]\s+/gm, '') // unordered lists
    .replace(/^[\s]*\d+\.\s+/gm, '') // ordered lists
    .replace(/^>\s+/gm, '') // blockquotes
    .replace(/\n{2,}/g, ' ') // collapse multiple newlines
    .replace(/\n/g, ' ') // remaining newlines to spaces
    .trim()
