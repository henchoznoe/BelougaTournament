/**
 * File: lib/types/registration.ts
 * Description: Types for the global admin registrations page.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import type {
  FieldType,
  PaymentStatus,
  RegistrationStatus,
  TournamentFormat,
  TournamentStatus,
} from '@/prisma/generated/prisma/enums'

/** A registration row for the global admin registrations table. */
export type RegistrationRow = {
  id: string
  createdAt: Date
  status: RegistrationStatus
  paymentStatus: PaymentStatus
  payment: {
    id: string
    amount: number
    currency: string
    paidAt: Date | null
    refundedAt: Date | null
  } | null
  fieldValues: Record<string, string | number>
  user: {
    id: string
    name: string
    displayName: string
    image: string | null
    bannedUntil: Date | null
  }
  tournament: {
    id: string
    title: string
    slug: string
    format: TournamentFormat
    status: TournamentStatus
    fields: {
      label: string
      type: FieldType
      required: boolean
      order: number
    }[]
  }
  team: {
    id: string
    name: string
    captainId: string
    isFull: boolean
  } | null
}

/** Lightweight team option for the "change team" dropdown. */
export type TeamOption = {
  id: string
  name: string
  isFull: boolean
}
