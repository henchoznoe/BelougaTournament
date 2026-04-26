/**
 * File: tests/utils/refund-policy-label.test.ts
 * Description: Tests for the refund policy label utility.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { describe, expect, it } from 'vitest'
import { getRefundPolicyLabel } from '@/lib/utils/refund-policy-label'

describe('getRefundPolicyLabel', () => {
  it('returns deadline message with plural days when BEFORE_DEADLINE and days > 1', () => {
    const result = getRefundPolicyLabel('BEFORE_DEADLINE', 7)

    expect(result).toBe(
      "Remboursement possible jusqu'à 7 jours avant le début du tournoi (frais Stripe déduits). Passé ce délai, aucun remboursement ne sera effectué.",
    )
  })

  it('returns deadline message with singular day when BEFORE_DEADLINE and days = 1', () => {
    const result = getRefundPolicyLabel('BEFORE_DEADLINE', 1)

    expect(result).toBe(
      "Remboursement possible jusqu'à 1 jour avant le début du tournoi (frais Stripe déduits). Passé ce délai, aucun remboursement ne sera effectué.",
    )
  })

  it('returns no-refund message when policy is NONE', () => {
    const result = getRefundPolicyLabel('NONE', null)

    expect(result).toBe(
      'Ce tournoi ne propose pas de remboursement en cas de désinscription.',
    )
  })

  it('returns no-refund message when BEFORE_DEADLINE but days is null', () => {
    const result = getRefundPolicyLabel('BEFORE_DEADLINE', null)

    expect(result).toBe(
      'Ce tournoi ne propose pas de remboursement en cas de désinscription.',
    )
  })
})
