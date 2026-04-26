/**
 * File: lib/utils/refund-policy-label.ts
 * Description: Computes the French refund policy label for display on public tournament registration forms.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { RefundPolicyType } from '@/prisma/generated/prisma/enums'

export const getRefundPolicyLabel = (
  refundPolicyType: RefundPolicyType,
  refundDeadlineDays: number | null,
): string => {
  if (
    refundPolicyType === RefundPolicyType.BEFORE_DEADLINE &&
    refundDeadlineDays !== null
  ) {
    const plural = refundDeadlineDays > 1 ? 's' : ''
    return `Remboursement possible jusqu'à ${refundDeadlineDays} jour${plural} avant le début du tournoi (frais Stripe déduits). Passé ce délai, aucun remboursement ne sera effectué.`
  }
  return 'Ce tournoi ne propose pas de remboursement en cas de désinscription.'
}
