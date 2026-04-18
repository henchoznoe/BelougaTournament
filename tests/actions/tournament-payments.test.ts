/**
 * File: tests/actions/tournament-payments.test.ts
 * Description: Unit tests for paid tournament checkout actions.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  RefundPolicyType,
  RegistrationType,
  Role,
  TournamentFormat,
  TournamentStatus,
} from '@/prisma/generated/prisma/enums'

const TOURNAMENT_UUID = '11111111-1111-4111-8111-111111111111'

vi.mock('server-only', () => ({}))

const mockGetSession = vi.fn()
vi.mock('@/lib/core/auth', () => ({
  default: {
    api: { getSession: (...args: unknown[]) => mockGetSession(...args) },
  },
}))

vi.mock('next/headers', () => ({
  headers: vi.fn().mockResolvedValue(new Headers()),
}))

vi.mock('@/lib/core/env', () => ({
  env: {
    NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
  },
}))

vi.mock('@/lib/core/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))

vi.mock('next/cache', () => ({
  revalidateTag: vi.fn(),
  cacheLife: vi.fn(),
  cacheTag: vi.fn(),
}))

const mockCheckoutCreate = vi.fn()
vi.mock('@/lib/core/stripe', () => ({
  REGISTRATION_HOLD_MINUTES: 15,
  getStripe: () => ({
    checkout: {
      sessions: {
        create: (...args: unknown[]) => mockCheckoutCreate(...args),
      },
    },
  }),
}))

const mockUserFindUnique = vi.fn()
const mockTournamentFindUnique = vi.fn()
const mockRegistrationFindUnique = vi.fn()
const mockRegistrationCount = vi.fn()
const mockRegistrationCreate = vi.fn()
const mockRegistrationUpdate = vi.fn()
const mockPaymentUpdateMany = vi.fn()
const mockPaymentCreate = vi.fn()
const mockPaymentUpdate = vi.fn()
const mockTransaction = vi.fn()

vi.mock('@/lib/core/prisma', () => ({
  default: {
    user: {
      findUnique: (...args: unknown[]) => mockUserFindUnique(...args),
    },
    tournament: {
      findUnique: (...args: unknown[]) => mockTournamentFindUnique(...args),
    },
    tournamentRegistration: {
      findUnique: (...args: unknown[]) => mockRegistrationFindUnique(...args),
      count: (...args: unknown[]) => mockRegistrationCount(...args),
      create: (...args: unknown[]) => mockRegistrationCreate(...args),
      update: (...args: unknown[]) => mockRegistrationUpdate(...args),
    },
    payment: {
      updateMany: (...args: unknown[]) => mockPaymentUpdateMany(...args),
      create: (...args: unknown[]) => mockPaymentCreate(...args),
      update: (...args: unknown[]) => mockPaymentUpdate(...args),
    },
    $transaction: (...args: unknown[]) => mockTransaction(...args),
  },
}))

const { registerForTournament } = await import('@/lib/actions/tournaments')

describe('paid tournament registration actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()

    mockGetSession.mockResolvedValue({
      user: {
        id: 'user-1',
        role: Role.USER,
        email: 'user@test.com',
        name: 'User',
      },
      session: {
        id: 'sess-1',
        userId: 'user-1',
        token: 'tok',
        expiresAt: '2027-01-01',
      },
    })

    mockTournamentFindUnique.mockResolvedValue({
      id: TOURNAMENT_UUID,
      title: 'PUBG Duo Cup',
      status: TournamentStatus.PUBLISHED,
      format: TournamentFormat.SOLO,
      registrationOpen: new Date('2026-04-01T00:00:00.000Z'),
      registrationClose: new Date('2026-05-01T00:00:00.000Z'),
      maxTeams: null,
      teamSize: 1,
      registrationType: RegistrationType.PAID,
      entryFeeAmount: 500,
      entryFeeCurrency: 'CHF',
      refundPolicyType: RefundPolicyType.BEFORE_DEADLINE,
      refundDeadlineDays: 14,
      fields: [],
    })
    mockRegistrationFindUnique.mockResolvedValue(null)
    mockRegistrationCount.mockResolvedValue(0)
    mockRegistrationCreate.mockResolvedValue({ id: 'reg-1' })
    mockPaymentCreate.mockResolvedValue({ id: 'pay-1' })
    mockCheckoutCreate.mockResolvedValue({
      id: 'cs_test_123',
      url: 'https://checkout.stripe.test/session',
      customer: null,
    })

    mockTransaction.mockImplementation(async callback =>
      callback({
        payment: {
          updateMany: mockPaymentUpdateMany,
          create: mockPaymentCreate,
          update: mockPaymentUpdate,
        },
        tournamentRegistration: {
          update: mockRegistrationUpdate,
        },
      }),
    )

    vi.setSystemTime(new Date('2026-04-15T12:00:00.000Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('creates a Stripe checkout session for paid solo registrations', async () => {
    const result = await registerForTournament({
      tournamentId: TOURNAMENT_UUID,
      returnPath: '/tournaments/pubg-duo-cup',
      fieldValues: {},
    })

    expect(result.success).toBe(true)
    expect(result.data).toEqual({
      checkoutUrl: 'https://checkout.stripe.test/session',
    })
    expect(mockRegistrationCreate).toHaveBeenCalledOnce()
    expect(mockPaymentCreate).toHaveBeenCalledOnce()
    expect(mockCheckoutCreate).toHaveBeenCalledOnce()
  })
})
