/**
 * File: tests/services/tournaments-user.test.ts
 * Description: Unit tests for user-specific tournament services.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  PaymentStatus,
  RegistrationStatus,
  TournamentStatus,
} from '@/prisma/generated/prisma/enums'

vi.mock('server-only', () => ({}))
vi.mock('next/cache', () => ({ cacheLife: vi.fn(), cacheTag: vi.fn() }))

const mockLoggerError = vi.fn()
vi.mock('@/lib/core/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: (...args: unknown[]) => mockLoggerError(...args),
  },
}))

const mockCleanupExpiredPendingRegistrations = vi.fn()
vi.mock('@/lib/utils/registration-expiry', () => ({
  cleanupExpiredPendingRegistrations: (...args: unknown[]) =>
    mockCleanupExpiredPendingRegistrations(...args),
}))

const mockRegistrationFindFirst = vi.fn()
const mockTournamentFindMany = vi.fn()

vi.mock('@/lib/core/prisma', () => ({
  default: {
    tournamentRegistration: {
      findFirst: (...args: unknown[]) => mockRegistrationFindFirst(...args),
    },
    tournament: {
      findMany: (...args: unknown[]) => mockTournamentFindMany(...args),
    },
  },
}))

const USER_ID = 'user-1'
const TOURNAMENT_ID = 'tournament-1'
const EXPIRY_DATE = new Date('2026-04-24T12:00:00.000Z')
const START_DATE = new Date('2026-06-01T10:00:00.000Z')

const { getUserTournamentRegistrationState, getUserActiveTournaments } =
  await import('@/lib/services/tournaments-user')

describe('getUserTournamentRegistrationState', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should clean up expired registrations before fetching the active registration state', async () => {
    const registrationState = {
      id: 'registration-1',
      status: RegistrationStatus.PENDING,
      paymentStatus: PaymentStatus.PENDING,
      expiresAt: EXPIRY_DATE,
    }
    mockCleanupExpiredPendingRegistrations.mockResolvedValue(0)
    mockRegistrationFindFirst.mockResolvedValue(registrationState)

    const result = await getUserTournamentRegistrationState(
      USER_ID,
      TOURNAMENT_ID,
    )

    expect(result).toEqual(registrationState)
    expect(mockCleanupExpiredPendingRegistrations).toHaveBeenCalledWith(USER_ID)
    expect(mockRegistrationFindFirst).toHaveBeenCalledWith({
      where: {
        tournamentId: TOURNAMENT_ID,
        userId: USER_ID,
        status: {
          in: [RegistrationStatus.PENDING, RegistrationStatus.CONFIRMED],
        },
      },
      select: {
        id: true,
        status: true,
        paymentStatus: true,
        expiresAt: true,
      },
    })
  })

  it('should return null when cleanup throws before the query runs', async () => {
    mockCleanupExpiredPendingRegistrations.mockRejectedValue(
      new Error('cleanup failed'),
    )

    const result = await getUserTournamentRegistrationState(
      USER_ID,
      TOURNAMENT_ID,
    )

    expect(result).toBeNull()
    expect(mockRegistrationFindFirst).not.toHaveBeenCalled()
    expect(mockLoggerError).toHaveBeenCalledOnce()
  })
})

describe('getUserActiveTournaments', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return active tournaments with the expected published and confirmed filters', async () => {
    const activeTournaments = [
      {
        id: 'tournament-1',
        title: 'Belouga Cup',
        slug: 'belouga-cup',
        games: ['Valorant'],
        startDate: START_DATE,
        imageUrls: ['https://cdn.test/belouga.png'],
      },
    ]
    mockTournamentFindMany.mockResolvedValue(activeTournaments)

    const result = await getUserActiveTournaments(USER_ID)

    expect(result).toEqual(activeTournaments)
    expect(mockTournamentFindMany).toHaveBeenCalledWith({
      where: {
        status: TournamentStatus.PUBLISHED,
        registrations: {
          some: {
            userId: USER_ID,
            status: RegistrationStatus.CONFIRMED,
          },
        },
      },
      orderBy: { startDate: 'asc' },
      select: {
        id: true,
        title: true,
        slug: true,
        games: true,
        startDate: true,
        imageUrls: true,
      },
    })
  })

  it('should return an empty array when the database query fails', async () => {
    mockTournamentFindMany.mockRejectedValue(new Error('database failed'))

    const result = await getUserActiveTournaments(USER_ID)

    expect(result).toEqual([])
    expect(mockLoggerError).toHaveBeenCalledOnce()
  })
})
