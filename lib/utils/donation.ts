/**
 * File: lib/utils/donation.ts
 * Description: Shared helpers for validating optional registration donations.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { formatCentimes } from '@/lib/utils/formatting'
import { DonationType, RegistrationType } from '@/prisma/generated/prisma/enums'

interface DonationTournamentConfig {
  registrationType: RegistrationType
  entryFeeCurrency: string | null
  donationEnabled: boolean
  donationType: DonationType | null
  donationFixedAmount: number | null
  donationMinAmount: number | null
}

/** Validates and resolves the optional donation amount against the live tournament config. */
export const resolveDonationAmount = ({
  tournament,
  donationAmount,
}: {
  tournament: DonationTournamentConfig
  donationAmount?: number | null
}):
  | { valid: true; donationAmount: number }
  | { valid: false; message: string } => {
  if (
    donationAmount === null ||
    donationAmount === undefined ||
    donationAmount === 0
  ) {
    return { valid: true, donationAmount: 0 }
  }

  if (
    !tournament.donationEnabled ||
    tournament.registrationType !== RegistrationType.PAID
  ) {
    return {
      valid: false,
      message: "Le don n'est pas disponible pour ce tournoi.",
    }
  }

  if (tournament.donationType === DonationType.FIXED) {
    if (tournament.donationFixedAmount === null) {
      return {
        valid: false,
        message:
          "Le don fixe n'est pas correctement configuré pour ce tournoi.",
      }
    }

    if (donationAmount !== tournament.donationFixedAmount) {
      return {
        valid: false,
        message: `Le don doit être de ${formatCentimes(tournament.donationFixedAmount, tournament.entryFeeCurrency ?? 'CHF')}.`,
      }
    }

    return { valid: true, donationAmount }
  }

  if (tournament.donationType === DonationType.FREE) {
    if (
      tournament.donationMinAmount !== null &&
      donationAmount < tournament.donationMinAmount
    ) {
      return {
        valid: false,
        message: `Le don doit être d'au moins ${formatCentimes(tournament.donationMinAmount, tournament.entryFeeCurrency ?? 'CHF')}.`,
      }
    }

    return { valid: true, donationAmount }
  }

  return {
    valid: false,
    message: "Le don n'est pas correctement configuré pour ce tournoi.",
  }
}
