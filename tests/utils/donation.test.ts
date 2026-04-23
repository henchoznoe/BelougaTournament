/**
 * File: tests/utils/donation.test.ts
 * Description: Unit tests for tournament donation validation and resolution.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { describe, expect, it } from 'vitest'
import { DonationType, RegistrationType } from '@/prisma/generated/prisma/enums'

const { resolveDonationAmount } = await import('@/lib/utils/donation')

const FIXED_DONATION_AMOUNT = 1000
const FREE_DONATION_MIN_AMOUNT = 500
const BELOW_MIN_DONATION_AMOUNT = 300
const VALID_FREE_DONATION_AMOUNT = 700

type DonationTournament = Parameters<
  typeof resolveDonationAmount
>[0]['tournament']

const DEFAULT_TOURNAMENT: DonationTournament = {
  registrationType: RegistrationType.PAID,
  entryFeeCurrency: 'CHF',
  donationEnabled: true,
  donationType: DonationType.FIXED,
  donationFixedAmount: FIXED_DONATION_AMOUNT,
  donationMinAmount: FREE_DONATION_MIN_AMOUNT,
}

const buildTournament = (
  overrides: Partial<DonationTournament> = {},
): DonationTournament => ({
  registrationType:
    overrides.registrationType === undefined
      ? DEFAULT_TOURNAMENT.registrationType
      : overrides.registrationType,
  entryFeeCurrency:
    overrides.entryFeeCurrency === undefined
      ? DEFAULT_TOURNAMENT.entryFeeCurrency
      : overrides.entryFeeCurrency,
  donationEnabled:
    overrides.donationEnabled === undefined
      ? DEFAULT_TOURNAMENT.donationEnabled
      : overrides.donationEnabled,
  donationType:
    overrides.donationType === undefined
      ? DEFAULT_TOURNAMENT.donationType
      : overrides.donationType,
  donationFixedAmount:
    overrides.donationFixedAmount === undefined
      ? DEFAULT_TOURNAMENT.donationFixedAmount
      : overrides.donationFixedAmount,
  donationMinAmount:
    overrides.donationMinAmount === undefined
      ? DEFAULT_TOURNAMENT.donationMinAmount
      : overrides.donationMinAmount,
})

describe('resolveDonationAmount', () => {
  it('should resolve nullish or zero donation values to 0', () => {
    expect(
      resolveDonationAmount({
        tournament: buildTournament(),
        donationAmount: undefined,
      }),
    ).toEqual({ valid: true, donationAmount: 0 })
    expect(
      resolveDonationAmount({
        tournament: buildTournament(),
        donationAmount: null,
      }),
    ).toEqual({ valid: true, donationAmount: 0 })
    expect(
      resolveDonationAmount({
        tournament: buildTournament(),
        donationAmount: 0,
      }),
    ).toEqual({ valid: true, donationAmount: 0 })
  })

  it('should reject donations when the tournament does not allow them', () => {
    const result = resolveDonationAmount({
      tournament: buildTournament({ donationEnabled: false }),
      donationAmount: FIXED_DONATION_AMOUNT,
    })

    expect(result).toEqual({
      valid: false,
      message: "Le don n'est pas disponible pour ce tournoi.",
    })
  })

  it('should reject donations for free registrations', () => {
    const result = resolveDonationAmount({
      tournament: buildTournament({ registrationType: RegistrationType.FREE }),
      donationAmount: FIXED_DONATION_AMOUNT,
    })

    expect(result).toEqual({
      valid: false,
      message: "Le don n'est pas disponible pour ce tournoi.",
    })
  })

  it('should reject fixed donations when the fixed amount is not configured', () => {
    const result = resolveDonationAmount({
      tournament: buildTournament({ donationFixedAmount: null }),
      donationAmount: FIXED_DONATION_AMOUNT,
    })

    expect(result).toEqual({
      valid: false,
      message: "Le don fixe n'est pas correctement configuré pour ce tournoi.",
    })
  })

  it('should reject fixed donations that do not match the configured amount', () => {
    const result = resolveDonationAmount({
      tournament: buildTournament(),
      donationAmount: VALID_FREE_DONATION_AMOUNT,
    })

    expect(result).toEqual({
      valid: false,
      message: 'Le don doit être de 10.00 CHF.',
    })
  })

  it('should accept the configured fixed donation amount', () => {
    const result = resolveDonationAmount({
      tournament: buildTournament(),
      donationAmount: FIXED_DONATION_AMOUNT,
    })

    expect(result).toEqual({
      valid: true,
      donationAmount: FIXED_DONATION_AMOUNT,
    })
  })

  it('should reject free donations below the configured minimum', () => {
    const result = resolveDonationAmount({
      tournament: buildTournament({
        donationType: DonationType.FREE,
        donationFixedAmount: null,
      }),
      donationAmount: BELOW_MIN_DONATION_AMOUNT,
    })

    expect(result).toEqual({
      valid: false,
      message: "Le don doit être d'au moins 5.00 CHF.",
    })
  })

  it('should accept free donations that meet the minimum amount', () => {
    const result = resolveDonationAmount({
      tournament: buildTournament({
        donationType: DonationType.FREE,
        donationFixedAmount: null,
      }),
      donationAmount: VALID_FREE_DONATION_AMOUNT,
    })

    expect(result).toEqual({
      valid: true,
      donationAmount: VALID_FREE_DONATION_AMOUNT,
    })
  })

  it('should reject invalid donation configurations without a supported donation type', () => {
    const result = resolveDonationAmount({
      tournament: buildTournament({
        donationType: null,
        donationFixedAmount: null,
      }),
      donationAmount: VALID_FREE_DONATION_AMOUNT,
    })

    expect(result).toEqual({
      valid: false,
      message: "Le don n'est pas correctement configuré pour ce tournoi.",
    })
  })
})
