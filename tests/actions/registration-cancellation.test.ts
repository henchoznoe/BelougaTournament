/**
 * File: tests/actions/registration-cancellation.test.ts
 * Description: Unit tests for the shared registration cancellation helper.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  PaymentStatus,
  RegistrationStatus,
} from '@/prisma/generated/prisma/enums'

vi.mock('server-only', () => ({}))

const REGISTRATION_ID = 'registration-1'
const PAYMENT_ID = 'payment-1'
const TOTAL_AMOUNT = 5200
const STRIPE_FEE = 200
const DONATION_AMOUNT = 1000
const NOW = new Date('2026-04-23T10:30:00.000Z')

const { cancelOrDeleteRegistration } = await import(
  '@/lib/actions/registration-cancellation'
)

type CancelRegistrationArgs = Parameters<typeof cancelOrDeleteRegistration>[0]

interface MockTransaction {
  tournamentRegistration: {
    delete: ReturnType<typeof vi.fn>
    update: ReturnType<typeof vi.fn>
  }
  payment: {
    update: ReturnType<typeof vi.fn>
  }
}

const createMockTransaction = (): MockTransaction => ({
  tournamentRegistration: {
    delete: vi.fn().mockResolvedValue(undefined),
    update: vi.fn().mockResolvedValue(undefined),
  },
  payment: {
    update: vi.fn().mockResolvedValue(undefined),
  },
})

const LATEST_PAYMENT = {
  id: PAYMENT_ID,
  amount: TOTAL_AMOUNT,
  stripeFee: STRIPE_FEE,
  donationAmount: DONATION_AMOUNT,
}

const toTransaction = (tx: MockTransaction): CancelRegistrationArgs['tx'] =>
  tx as unknown as CancelRegistrationArgs['tx']

describe('cancelOrDeleteRegistration', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(NOW)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should delete free registrations without touching payments', async () => {
    const tx = createMockTransaction()

    await cancelOrDeleteRegistration({
      tx: toTransaction(tx),
      registrationId: REGISTRATION_ID,
      paymentRequiredSnapshot: false,
      previousPaymentStatus: PaymentStatus.NOT_REQUIRED,
    })

    expect(tx.tournamentRegistration.delete).toHaveBeenCalledWith({
      where: { id: REGISTRATION_ID },
    })
    expect(tx.tournamentRegistration.update).not.toHaveBeenCalled()
    expect(tx.payment.update).not.toHaveBeenCalled()
  })

  it('should cancel paid registrations and preserve the previous payment status by default', async () => {
    const tx = createMockTransaction()

    await cancelOrDeleteRegistration({
      tx: toTransaction(tx),
      registrationId: REGISTRATION_ID,
      paymentRequiredSnapshot: true,
      previousPaymentStatus: PaymentStatus.PAID,
      latestPayment: LATEST_PAYMENT,
    })

    expect(tx.tournamentRegistration.update).toHaveBeenCalledWith({
      where: { id: REGISTRATION_ID },
      data: {
        status: RegistrationStatus.CANCELLED,
        paymentStatus: PaymentStatus.PAID,
        cancelledAt: NOW,
        teamId: null,
      },
    })
    expect(tx.payment.update).not.toHaveBeenCalled()
  })

  it('should mark both registration and payment as refunded when resolution is refund', async () => {
    const tx = createMockTransaction()

    await cancelOrDeleteRegistration({
      tx: toTransaction(tx),
      registrationId: REGISTRATION_ID,
      paymentRequiredSnapshot: true,
      previousPaymentStatus: PaymentStatus.PAID,
      latestPayment: LATEST_PAYMENT,
      resolution: 'refund',
    })

    expect(tx.tournamentRegistration.update).toHaveBeenCalledWith({
      where: { id: REGISTRATION_ID },
      data: {
        status: RegistrationStatus.CANCELLED,
        paymentStatus: PaymentStatus.REFUNDED,
        cancelledAt: NOW,
        teamId: null,
      },
    })
    expect(tx.payment.update).toHaveBeenCalledWith({
      where: { id: PAYMENT_ID },
      data: {
        status: PaymentStatus.REFUNDED,
        refundAmount: TOTAL_AMOUNT - STRIPE_FEE - DONATION_AMOUNT,
        refundedAt: NOW,
      },
    })
  })

  it('should exclude the donation from the refund when refundIncludesDonation is false', async () => {
    const tx = createMockTransaction()

    await cancelOrDeleteRegistration({
      tx: toTransaction(tx),
      registrationId: REGISTRATION_ID,
      paymentRequiredSnapshot: true,
      previousPaymentStatus: PaymentStatus.PAID,
      latestPayment: LATEST_PAYMENT,
      resolution: 'refund',
      clearTeamId: false,
      clearExpiresAt: true,
      refundIncludesDonation: false,
    })

    expect(tx.tournamentRegistration.update).toHaveBeenCalledWith({
      where: { id: REGISTRATION_ID },
      data: {
        status: RegistrationStatus.CANCELLED,
        paymentStatus: PaymentStatus.REFUNDED,
        cancelledAt: NOW,
        expiresAt: null,
      },
    })
    expect(tx.payment.update).toHaveBeenCalledWith({
      where: { id: PAYMENT_ID },
      data: {
        status: PaymentStatus.REFUNDED,
        refundAmount: TOTAL_AMOUNT - STRIPE_FEE,
        refundedAt: NOW,
      },
    })
  })

  it('should mark the payment as forfeited when resolution is forfeit', async () => {
    const tx = createMockTransaction()

    await cancelOrDeleteRegistration({
      tx: toTransaction(tx),
      registrationId: REGISTRATION_ID,
      paymentRequiredSnapshot: true,
      previousPaymentStatus: PaymentStatus.PAID,
      latestPayment: LATEST_PAYMENT,
      resolution: 'forfeit',
    })

    expect(tx.tournamentRegistration.update).toHaveBeenCalledWith({
      where: { id: REGISTRATION_ID },
      data: {
        status: RegistrationStatus.CANCELLED,
        paymentStatus: PaymentStatus.FORFEITED,
        cancelledAt: NOW,
        teamId: null,
      },
    })
    expect(tx.payment.update).toHaveBeenCalledWith({
      where: { id: PAYMENT_ID },
      data: { status: PaymentStatus.FORFEITED },
    })
  })

  it('should skip payment updates when no latest payment exists', async () => {
    const tx = createMockTransaction()

    await cancelOrDeleteRegistration({
      tx: toTransaction(tx),
      registrationId: REGISTRATION_ID,
      paymentRequiredSnapshot: true,
      previousPaymentStatus: PaymentStatus.PENDING,
      latestPayment: null,
      resolution: 'refund',
    })

    expect(tx.tournamentRegistration.update).toHaveBeenCalledOnce()
    expect(tx.payment.update).not.toHaveBeenCalled()
  })
})
