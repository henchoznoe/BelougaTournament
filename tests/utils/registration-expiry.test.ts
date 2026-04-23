/**
 * File: tests/utils/registration-expiry.test.ts
 * Description: Unit tests for stale pending registration cleanup.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { CACHE_TAGS } from '@/lib/config/constants'
import {
  PaymentStatus,
  RegistrationStatus,
} from '@/prisma/generated/prisma/enums'

vi.mock('server-only', () => ({}))

const USER_ID = 'user-1'
const TOURNAMENT_ID = 'tournament-1'
const REGISTRATION_ID = 'registration-1'
const NOW = new Date('2026-04-23T12:00:00.000Z')
const EXPIRED_AT = new Date('2026-04-23T11:00:00.000Z')
const FUTURE_EXPIRES_AT = new Date('2026-04-23T13:00:00.000Z')

const mockUpdateTag = vi.fn()
vi.mock('next/cache', () => ({
  updateTag: (...args: unknown[]) => mockUpdateTag(...args),
}))

const mockRemoveUserFromTeam = vi.fn()
vi.mock('@/lib/utils/team', () => ({
  removeUserFromTeam: (...args: unknown[]) => mockRemoveUserFromTeam(...args),
}))

const mockFindMany = vi.fn()
const mockTransaction = vi.fn()
const mockTxFindUnique = vi.fn()
const mockTxRegistrationUpdate = vi.fn()
const mockTxPaymentUpdateMany = vi.fn()

vi.mock('@/lib/core/prisma', () => ({
  default: {
    tournamentRegistration: {
      findMany: (...args: unknown[]) => mockFindMany(...args),
    },
    $transaction: (...args: unknown[]) => mockTransaction(...args),
  },
}))

const { cleanupExpiredPendingRegistrations } = await import(
  '@/lib/utils/registration-expiry'
)

describe('cleanupExpiredPendingRegistrations', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    mockTransaction.mockImplementation(
      async (callback: (tx: unknown) => Promise<void>) =>
        callback({
          tournamentRegistration: {
            findUnique: mockTxFindUnique,
            update: mockTxRegistrationUpdate,
          },
          payment: {
            updateMany: mockTxPaymentUpdateMany,
          },
        }),
    )
  })

  it('should return 0 when no stale registrations exist', async () => {
    mockFindMany.mockResolvedValue([])

    const result = await cleanupExpiredPendingRegistrations(USER_ID, NOW)

    expect(result).toBe(0)
    expect(mockTransaction).not.toHaveBeenCalled()
    expect(mockUpdateTag).not.toHaveBeenCalled()
  })

  it('should expire stale registrations, cancel pending payments, and invalidate cache tags', async () => {
    mockFindMany.mockResolvedValue([
      {
        id: REGISTRATION_ID,
        tournamentId: TOURNAMENT_ID,
      },
    ])
    mockTxFindUnique.mockResolvedValue({
      id: REGISTRATION_ID,
      status: RegistrationStatus.PENDING,
      tournamentId: TOURNAMENT_ID,
      expiresAt: EXPIRED_AT,
    })

    const result = await cleanupExpiredPendingRegistrations(USER_ID, NOW)

    expect(result).toBe(1)
    expect(mockFindMany).toHaveBeenCalledWith({
      where: {
        userId: USER_ID,
        status: RegistrationStatus.PENDING,
        expiresAt: { not: null, lte: NOW },
      },
      select: {
        id: true,
        tournamentId: true,
      },
    })
    expect(mockRemoveUserFromTeam).toHaveBeenCalledWith(
      expect.objectContaining({
        payment: expect.objectContaining({
          updateMany: mockTxPaymentUpdateMany,
        }),
      }),
      USER_ID,
      TOURNAMENT_ID,
    )
    expect(mockTxPaymentUpdateMany).toHaveBeenCalledWith({
      where: {
        registrationId: REGISTRATION_ID,
        status: { in: [PaymentStatus.PENDING, PaymentStatus.UNPAID] },
      },
      data: { status: PaymentStatus.CANCELLED },
    })
    expect(mockTxRegistrationUpdate).toHaveBeenCalledWith({
      where: { id: REGISTRATION_ID },
      data: {
        status: RegistrationStatus.EXPIRED,
        paymentStatus: PaymentStatus.CANCELLED,
        teamId: null,
        expiresAt: NOW,
      },
    })
    expect(mockUpdateTag).toHaveBeenCalledTimes(4)
    expect(mockUpdateTag).toHaveBeenNthCalledWith(1, CACHE_TAGS.TOURNAMENTS)
    expect(mockUpdateTag).toHaveBeenNthCalledWith(
      2,
      CACHE_TAGS.DASHBOARD_REGISTRATIONS,
    )
    expect(mockUpdateTag).toHaveBeenNthCalledWith(3, CACHE_TAGS.DASHBOARD_STATS)
    expect(mockUpdateTag).toHaveBeenNthCalledWith(
      4,
      CACHE_TAGS.DASHBOARD_PAYMENTS,
    )
  })

  it('should skip database mutations when the registration is no longer stale after recheck', async () => {
    mockFindMany.mockResolvedValue([
      {
        id: REGISTRATION_ID,
        tournamentId: TOURNAMENT_ID,
      },
    ])
    mockTxFindUnique.mockResolvedValue({
      id: REGISTRATION_ID,
      status: RegistrationStatus.PENDING,
      tournamentId: TOURNAMENT_ID,
      expiresAt: FUTURE_EXPIRES_AT,
    })

    const result = await cleanupExpiredPendingRegistrations(USER_ID, NOW)

    expect(result).toBe(1)
    expect(mockRemoveUserFromTeam).not.toHaveBeenCalled()
    expect(mockTxPaymentUpdateMany).not.toHaveBeenCalled()
    expect(mockTxRegistrationUpdate).not.toHaveBeenCalled()
  })
})
