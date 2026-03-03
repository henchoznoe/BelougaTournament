/**
 * File: lib/utils/formatting.ts
 * Description: Utility functions for date formatting
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
