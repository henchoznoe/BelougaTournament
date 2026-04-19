/**
 * File: lib/utils/tournament-helpers.ts
 * Description: Shared tournament helper functions for field validation and refund eligibility.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { DAY_IN_MS } from '@/lib/config/constants'
import { FieldType, RefundPolicyType } from '@/prisma/generated/prisma/enums'

/** Type alias for parsed dynamic field values from Prisma JSON columns. */
type FieldValues = Record<string, string | number>

/**
 * Safely parses a Prisma `Json` field value into a typed `FieldValues` record.
 * Returns an empty object for null/undefined/non-object values.
 */
export const parseFieldValues = (raw: unknown): FieldValues => {
  if (
    raw === null ||
    raw === undefined ||
    typeof raw !== 'object' ||
    Array.isArray(raw)
  ) {
    return {}
  }
  return raw as FieldValues
}

/** Validates dynamic field values against tournament field definitions. */
export const validateFieldValues = (
  fields: { label: string; type: string; required: boolean }[],
  fieldValues: Record<string, string | number>,
): { valid: true } | { valid: false; message: string } => {
  // Reject keys that don't correspond to any defined field
  const definedLabels = new Set(fields.map(f => f.label))
  for (const key of Object.keys(fieldValues)) {
    if (!definedLabels.has(key)) {
      return {
        valid: false,
        message: `Le champ « ${key} » n'est pas défini pour ce tournoi.`,
      }
    }
  }

  for (const field of fields) {
    const value = fieldValues[field.label]
    if (field.required && (value === undefined || value === '')) {
      return {
        valid: false,
        message: `Le champ « ${field.label} » est requis.`,
      }
    }
    if (
      field.type === FieldType.NUMBER &&
      value !== undefined &&
      value !== ''
    ) {
      if (typeof value !== 'number' || Number.isNaN(value)) {
        return {
          valid: false,
          message: `Le champ « ${field.label} » doit être un nombre.`,
        }
      }
    }
  }
  return { valid: true }
}

/** Returns true when a player is still eligible for an automatic refund. */
export const isRefundEligible = (
  startDate: Date,
  refundPolicyType: RefundPolicyType,
  refundDeadlineDays: number | null,
  now: Date,
) => {
  if (refundPolicyType !== RefundPolicyType.BEFORE_DEADLINE) {
    return false
  }

  if (refundDeadlineDays === null) {
    return false
  }

  return startDate.getTime() - now.getTime() >= refundDeadlineDays * DAY_IN_MS
}
