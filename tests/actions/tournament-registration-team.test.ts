/**
 * File: tests/actions/tournament-registration-team.test.ts
 * Description: Unit tests for team-based tournament registration server actions:
 *   createTeamAndRegister and joinTeamAndRegister.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Prisma } from '@/prisma/generated/prisma/client'
import {
  RefundPolicyType,
  RegistrationStatus,
  RegistrationType,
  Role,
  TournamentFormat,
  TournamentStatus,
} from '@/prisma/generated/prisma/enums'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TOURNAMENT_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
const TEAM_ID = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
const REGISTRATION_ID = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc'
const PAYMENT_ID = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd'
const CAPTAIN_USER_ID = 'user-captain-1'
const JOINER_USER_ID = 'user-joiner-1'
const RETURN_PATH = '/tournaments/team-cup'
const TEAM_NAME = 'Les Wolves'

// ---------------------------------------------------------------------------
// Mocks (must be declared before any dynamic import)
// ---------------------------------------------------------------------------

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
  env: { NEXT_PUBLIC_APP_URL: 'http://localhost:3000' },
}))

vi.mock('@/lib/core/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))

vi.mock('next/cache', () => ({
  revalidateTag: vi.fn(),
  updateTag: vi.fn(),
  cacheLife: vi.fn(),
  cacheTag: vi.fn(),
}))

const mockCheckoutSessionsCreate = vi.fn()
vi.mock('@/lib/core/stripe', () => ({
  getStripe: () => ({
    checkout: {
      sessions: {
        create: (...args: unknown[]) => mockCheckoutSessionsCreate(...args),
      },
    },
  }),
}))

const mockUserFindUnique = vi.fn()
const mockTournamentFindUnique = vi.fn()
const mockRegistrationFindUnique = vi.fn()
const mockRegistrationFindFirst = vi.fn()
const mockRegistrationCount = vi.fn()
const mockRegistrationCreate = vi.fn()
const mockRegistrationUpdate = vi.fn()
const mockPaymentUpdateMany = vi.fn()
const mockPaymentCreate = vi.fn()
const mockPaymentUpdate = vi.fn()
const mockTeamFindUnique = vi.fn()
const mockTeamCreate = vi.fn()
const mockTeamUpdate = vi.fn()
const mockTeamCount = vi.fn()
const mockTeamMemberCreate = vi.fn()
const mockTeamMemberDeleteMany = vi.fn()
const mockTransaction = vi.fn()

vi.mock('@/lib/core/prisma', () => ({
  default: {
    user: { findUnique: (...a: unknown[]) => mockUserFindUnique(...a) },
    tournament: {
      findUnique: (...a: unknown[]) => mockTournamentFindUnique(...a),
    },
    tournamentRegistration: {
      findUnique: (...a: unknown[]) => mockRegistrationFindUnique(...a),
      findFirst: (...a: unknown[]) => mockRegistrationFindFirst(...a),
      count: (...a: unknown[]) => mockRegistrationCount(...a),
      create: (...a: unknown[]) => mockRegistrationCreate(...a),
      update: (...a: unknown[]) => mockRegistrationUpdate(...a),
    },
    payment: {
      updateMany: (...a: unknown[]) => mockPaymentUpdateMany(...a),
      create: (...a: unknown[]) => mockPaymentCreate(...a),
      update: (...a: unknown[]) => mockPaymentUpdate(...a),
    },
    team: {
      findUnique: (...a: unknown[]) => mockTeamFindUnique(...a),
      create: (...a: unknown[]) => mockTeamCreate(...a),
      update: (...a: unknown[]) => mockTeamUpdate(...a),
      count: (...a: unknown[]) => mockTeamCount(...a),
    },
    teamMember: {
      create: (...a: unknown[]) => mockTeamMemberCreate(...a),
      deleteMany: (...a: unknown[]) => mockTeamMemberDeleteMany(...a),
    },
    $transaction: (...a: unknown[]) => mockTransaction(...a),
  },
}))

// ---------------------------------------------------------------------------
// Lazy import (after mocks are wired)
// ---------------------------------------------------------------------------

const { createTeamAndRegister, joinTeamAndRegister } = await import(
  '@/lib/actions/tournament-registration-team'
)

// ---------------------------------------------------------------------------
// Factory helpers
// ---------------------------------------------------------------------------

const makeSession = (userId = CAPTAIN_USER_ID) => ({
  user: {
    id: userId,
    role: Role.USER,
    email: 'captain@test.com',
    name: 'Captain',
  },
  session: { id: 'sess-1', userId, token: 'tok', expiresAt: '2027-01-01' },
})

/** A fully open, published, FREE, TEAM tournament. */
const makeFreeTeamTournament = (overrides: Record<string, unknown> = {}) => ({
  id: TOURNAMENT_ID,
  title: 'Team Cup',
  status: TournamentStatus.PUBLISHED,
  format: TournamentFormat.TEAM,
  startDate: new Date('2026-04-15T00:00:00.000Z'),
  endDate: new Date('2026-04-16T00:00:00.000Z'),
  registrationOpen: new Date('2026-04-01T00:00:00.000Z'),
  registrationClose: new Date('2026-05-01T00:00:00.000Z'),
  maxTeams: null,
  teamSize: 5,
  registrationType: RegistrationType.FREE,
  entryFeeAmount: null,
  entryFeeCurrency: null,
  refundPolicyType: RefundPolicyType.NONE,
  refundDeadlineDays: null,
  fields: [],
  ...overrides,
})

/**
 * Standard transaction mock that wires all commonly needed Prisma methods
 * and executes the callback synchronously.
 */
const makeTxMock = (teamMemberCount = 1) =>
  mockTransaction.mockImplementation(
    async (cb: (tx: unknown) => Promise<unknown>) =>
      cb({
        tournamentRegistration: {
          count: mockRegistrationCount,
          create: mockRegistrationCreate,
          update: mockRegistrationUpdate,
          findUnique: mockRegistrationFindUnique,
        },
        payment: {
          updateMany: mockPaymentUpdateMany,
          create: mockPaymentCreate,
          update: mockPaymentUpdate,
        },
        team: {
          findUnique: mockTeamFindUnique,
          create: mockTeamCreate,
          update: mockTeamUpdate,
          count: mockTeamCount,
        },
        teamMember: {
          create: mockTeamMemberCreate,
          deleteMany: mockTeamMemberDeleteMany,
          findFirst: vi.fn().mockResolvedValue(null),
          count: vi.fn().mockResolvedValue(teamMemberCount),
        },
      }),
  )

// ===========================================================================
// createTeamAndRegister
// ===========================================================================

describe('createTeamAndRegister', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-04-15T12:00:00.000Z'))

    mockGetSession.mockResolvedValue(makeSession())
    mockUserFindUnique.mockResolvedValue({ bannedAt: null, bannedUntil: null })
    mockTournamentFindUnique.mockResolvedValue(makeFreeTeamTournament())
    mockRegistrationFindUnique.mockResolvedValue(null)
    mockRegistrationFindFirst.mockResolvedValue(null)
    mockRegistrationCount.mockResolvedValue(0)
    mockTeamCount.mockResolvedValue(0)
    mockTeamCreate.mockResolvedValue({ id: TEAM_ID, isFull: false })
    mockTeamMemberCreate.mockResolvedValue({})
    mockRegistrationCreate.mockResolvedValue({ id: REGISTRATION_ID })
    makeTxMock()
  })

  afterEach(() => vi.useRealTimers())

  it('should create a team and register the captain for a free TEAM tournament', async () => {
    const result = await createTeamAndRegister({
      tournamentId: TOURNAMENT_ID,
      returnPath: RETURN_PATH,
      teamName: TEAM_NAME,
      fieldValues: {},
    })

    expect(result.success).toBe(true)
    expect(result.message).toContain('équipe')
    expect(mockTeamCreate).toHaveBeenCalledOnce()
    expect(mockTeamMemberCreate).toHaveBeenCalledOnce()
    expect(mockRegistrationCreate).toHaveBeenCalledOnce()
    expect(mockCheckoutSessionsCreate).not.toHaveBeenCalled()
  })

  it('should return error when attempting to create a team on a SOLO tournament', async () => {
    mockTournamentFindUnique.mockResolvedValue(
      makeFreeTeamTournament({ format: TournamentFormat.SOLO }),
    )

    const result = await createTeamAndRegister({
      tournamentId: TOURNAMENT_ID,
      returnPath: RETURN_PATH,
      teamName: TEAM_NAME,
      fieldValues: {},
    })

    expect(result.success).toBe(false)
    expect(result.message).toContain('format solo')
  })

  it('should return error when maximum team count is reached', async () => {
    mockTournamentFindUnique.mockResolvedValue(
      makeFreeTeamTournament({ maxTeams: 2 }),
    )
    // Transaction: team count equals maxTeams → capacity reached
    mockTransaction.mockImplementation(
      async (cb: (tx: unknown) => Promise<unknown>) =>
        cb({
          tournamentRegistration: {
            count: mockRegistrationCount,
            create: mockRegistrationCreate,
            update: mockRegistrationUpdate,
          },
          payment: {
            updateMany: mockPaymentUpdateMany,
            create: mockPaymentCreate,
            update: mockPaymentUpdate,
          },
          team: {
            findUnique: mockTeamFindUnique,
            create: mockTeamCreate,
            update: mockTeamUpdate,
            count: vi.fn().mockResolvedValue(2), // exactly at limit
          },
          teamMember: {
            create: mockTeamMemberCreate,
            deleteMany: mockTeamMemberDeleteMany,
            findFirst: vi.fn().mockResolvedValue(null),
            count: vi.fn().mockResolvedValue(0),
          },
        }),
    )

    const result = await createTeamAndRegister({
      tournamentId: TOURNAMENT_ID,
      returnPath: RETURN_PATH,
      teamName: TEAM_NAME,
      fieldValues: {},
    })

    expect(result.success).toBe(false)
    expect(result.message).toContain('maximum')
  })

  it('should redirect to Stripe checkout when tournament is PAID', async () => {
    mockTournamentFindUnique.mockResolvedValue(
      makeFreeTeamTournament({
        registrationType: RegistrationType.PAID,
        entryFeeAmount: 2000,
        entryFeeCurrency: 'CHF',
        refundPolicyType: RefundPolicyType.BEFORE_DEADLINE,
        refundDeadlineDays: 7,
      }),
    )
    mockPaymentCreate.mockResolvedValue({ id: PAYMENT_ID })
    mockCheckoutSessionsCreate.mockResolvedValue({
      id: 'cs_test_team_123',
      url: 'https://checkout.stripe.test/team-session',
      customer: null,
    })

    const result = await createTeamAndRegister({
      tournamentId: TOURNAMENT_ID,
      returnPath: RETURN_PATH,
      teamName: TEAM_NAME,
      fieldValues: {},
    })

    expect(result.success).toBe(true)
    expect(result.data).toEqual({
      checkoutUrl: 'https://checkout.stripe.test/team-session',
    })
    expect(mockCheckoutSessionsCreate).toHaveBeenCalledOnce()
  })

  it('should return a friendly error when a concurrent team creation hits the unique team-name constraint', async () => {
    mockTransaction.mockRejectedValueOnce(
      new Prisma.PrismaClientKnownRequestError('duplicate', {
        code: 'P2002',
        clientVersion: '7.0.0',
      }),
    )

    const result = await createTeamAndRegister({
      tournamentId: TOURNAMENT_ID,
      returnPath: RETURN_PATH,
      teamName: TEAM_NAME,
      fieldValues: {},
    })

    expect(result.success).toBe(false)
    expect(result.message).toContain('déjà pris')
  })

  it('should return error when user is banned', async () => {
    mockUserFindUnique.mockResolvedValue({
      bannedAt: new Date('2026-01-01'),
      bannedUntil: null,
    })

    const result = await createTeamAndRegister({
      tournamentId: TOURNAMENT_ID,
      returnPath: RETURN_PATH,
      teamName: TEAM_NAME,
      fieldValues: {},
    })

    expect(result.success).toBe(false)
    expect(result.message).toContain('suspendu')
  })

  it('should validate field values before creating the team', async () => {
    mockTournamentFindUnique.mockResolvedValue(
      makeFreeTeamTournament({
        fields: [{ label: 'Discord', type: 'TEXT', required: true, order: 0 }],
      }),
    )

    const result = await createTeamAndRegister({
      tournamentId: TOURNAMENT_ID,
      returnPath: RETURN_PATH,
      teamName: TEAM_NAME,
      fieldValues: {}, // missing required 'Discord'
    })

    expect(result.success).toBe(false)
    // Team must NOT be created when field validation fails
    expect(mockTeamCreate).not.toHaveBeenCalled()
  })

  it('should return error when user is already confirmed for this tournament', async () => {
    mockRegistrationFindUnique.mockResolvedValue({
      id: REGISTRATION_ID,
      status: RegistrationStatus.CONFIRMED,
      paymentStatus: null,
      paymentRequiredSnapshot: false,
      expiresAt: null,
    })

    const result = await createTeamAndRegister({
      tournamentId: TOURNAMENT_ID,
      returnPath: RETURN_PATH,
      teamName: TEAM_NAME,
      fieldValues: {},
    })

    expect(result.success).toBe(false)
    expect(result.message).toContain('déjà inscrit')
  })
})

// ===========================================================================
// joinTeamAndRegister
// ===========================================================================

describe('joinTeamAndRegister', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-04-15T12:00:00.000Z'))

    mockGetSession.mockResolvedValue(makeSession(JOINER_USER_ID))
    mockUserFindUnique.mockResolvedValue({ bannedAt: null, bannedUntil: null })
    mockTournamentFindUnique.mockResolvedValue(
      makeFreeTeamTournament({ teamSize: 5 }),
    )
    mockRegistrationFindUnique.mockResolvedValue(null)
    mockRegistrationFindFirst.mockResolvedValue(null)
    // Outer pre-check: team exists and belongs to the tournament
    mockTeamFindUnique.mockResolvedValue({
      id: TEAM_ID,
      tournamentId: TOURNAMENT_ID,
      _count: { members: 2 },
    })
    mockRegistrationCreate.mockResolvedValue({ id: REGISTRATION_ID })
    mockTeamMemberCreate.mockResolvedValue({})
    // Transaction: re-fetch shows team still has room (2 < 5)
    mockTransaction.mockImplementation(
      async (cb: (tx: unknown) => Promise<unknown>) =>
        cb({
          tournamentRegistration: {
            count: mockRegistrationCount,
            create: mockRegistrationCreate,
            update: mockRegistrationUpdate,
          },
          payment: {
            updateMany: mockPaymentUpdateMany,
            create: mockPaymentCreate,
            update: mockPaymentUpdate,
          },
          team: {
            findUnique: vi
              .fn()
              .mockResolvedValue({ id: TEAM_ID, _count: { members: 2 } }),
            update: mockTeamUpdate,
            count: mockTeamCount,
          },
          teamMember: {
            create: mockTeamMemberCreate,
            deleteMany: mockTeamMemberDeleteMany,
            findFirst: vi.fn().mockResolvedValue(null),
            count: vi.fn().mockResolvedValue(3), // after join: 3/5
          },
        }),
    )
  })

  afterEach(() => vi.useRealTimers())

  it('should join a team and register the user for a free TEAM tournament', async () => {
    const result = await joinTeamAndRegister({
      tournamentId: TOURNAMENT_ID,
      returnPath: RETURN_PATH,
      teamId: TEAM_ID,
      fieldValues: {},
    })

    expect(result.success).toBe(true)
    expect(result.message).toContain('rejoint')
    expect(mockTeamMemberCreate).toHaveBeenCalledOnce()
    expect(mockRegistrationCreate).toHaveBeenCalledOnce()
    expect(mockCheckoutSessionsCreate).not.toHaveBeenCalled()
  })

  it('should return error when the team does not exist', async () => {
    mockTeamFindUnique.mockResolvedValue(null)

    const result = await joinTeamAndRegister({
      tournamentId: TOURNAMENT_ID,
      returnPath: RETURN_PATH,
      teamId: TEAM_ID,
      fieldValues: {},
    })

    expect(result.success).toBe(false)
    expect(result.message).toContain('introuvable')
  })

  it('should return error when the team belongs to a different tournament', async () => {
    const OTHER_TOURNAMENT_ID = 'ffffffff-ffff-4fff-8fff-ffffffffffff'
    mockTeamFindUnique.mockResolvedValue({
      id: TEAM_ID,
      tournamentId: OTHER_TOURNAMENT_ID, // mismatch
      _count: { members: 2 },
    })

    const result = await joinTeamAndRegister({
      tournamentId: TOURNAMENT_ID,
      returnPath: RETURN_PATH,
      teamId: TEAM_ID,
      fieldValues: {},
    })

    expect(result.success).toBe(false)
    expect(result.message).toContain('introuvable')
  })

  it('should return error when the team is full at transaction time (race condition)', async () => {
    // Outer check: team appears to have room (4/5)
    mockTeamFindUnique.mockResolvedValue({
      id: TEAM_ID,
      tournamentId: TOURNAMENT_ID,
      _count: { members: 4 },
    })
    // Transaction re-check: team is now full (5/5) — another player joined concurrently
    mockTransaction.mockImplementation(
      async (cb: (tx: unknown) => Promise<unknown>) =>
        cb({
          tournamentRegistration: {
            count: mockRegistrationCount,
            create: mockRegistrationCreate,
            update: mockRegistrationUpdate,
          },
          payment: {
            updateMany: mockPaymentUpdateMany,
            create: mockPaymentCreate,
            update: mockPaymentUpdate,
          },
          team: {
            findUnique: vi
              .fn()
              .mockResolvedValue({ id: TEAM_ID, _count: { members: 5 } }),
            update: mockTeamUpdate,
            count: mockTeamCount,
          },
          teamMember: {
            create: mockTeamMemberCreate,
            deleteMany: mockTeamMemberDeleteMany,
            findFirst: vi.fn().mockResolvedValue(null),
            count: vi.fn().mockResolvedValue(5),
          },
        }),
    )

    const result = await joinTeamAndRegister({
      tournamentId: TOURNAMENT_ID,
      returnPath: RETURN_PATH,
      teamId: TEAM_ID,
      fieldValues: {},
    })

    expect(result.success).toBe(false)
    expect(result.message).toContain('complète')
  })

  it('should return error when attempting to join a team on a SOLO tournament', async () => {
    mockTournamentFindUnique.mockResolvedValue(
      makeFreeTeamTournament({ format: TournamentFormat.SOLO }),
    )

    const result = await joinTeamAndRegister({
      tournamentId: TOURNAMENT_ID,
      returnPath: RETURN_PATH,
      teamId: TEAM_ID,
      fieldValues: {},
    })

    expect(result.success).toBe(false)
    expect(result.message).toContain('format solo')
  })

  it('should redirect to Stripe checkout when joining a paid team tournament', async () => {
    mockTournamentFindUnique.mockResolvedValue(
      makeFreeTeamTournament({
        registrationType: RegistrationType.PAID,
        entryFeeAmount: 1500,
        entryFeeCurrency: 'CHF',
        refundPolicyType: RefundPolicyType.BEFORE_DEADLINE,
        refundDeadlineDays: 7,
        teamSize: 5,
      }),
    )
    mockPaymentCreate.mockResolvedValue({ id: PAYMENT_ID })
    mockCheckoutSessionsCreate.mockResolvedValue({
      id: 'cs_test_join_123',
      url: 'https://checkout.stripe.test/join-session',
      customer: null,
    })

    const result = await joinTeamAndRegister({
      tournamentId: TOURNAMENT_ID,
      returnPath: RETURN_PATH,
      teamId: TEAM_ID,
      fieldValues: {},
    })

    expect(result.success).toBe(true)
    expect(result.data).toEqual({
      checkoutUrl: 'https://checkout.stripe.test/join-session',
    })
    expect(mockCheckoutSessionsCreate).toHaveBeenCalledOnce()
  })

  it('should validate field values before joining the team', async () => {
    mockTournamentFindUnique.mockResolvedValue(
      makeFreeTeamTournament({
        fields: [{ label: 'Rank', type: 'TEXT', required: true, order: 0 }],
      }),
    )

    const result = await joinTeamAndRegister({
      tournamentId: TOURNAMENT_ID,
      returnPath: RETURN_PATH,
      teamId: TEAM_ID,
      fieldValues: {}, // missing required 'Rank'
    })

    expect(result.success).toBe(false)
    // TeamMember must NOT be created when field validation fails
    expect(mockTeamMemberCreate).not.toHaveBeenCalled()
  })

  it('should return error when user is banned', async () => {
    mockUserFindUnique.mockResolvedValue({
      bannedAt: new Date('2026-01-01'),
      bannedUntil: null,
    })

    const result = await joinTeamAndRegister({
      tournamentId: TOURNAMENT_ID,
      returnPath: RETURN_PATH,
      teamId: TEAM_ID,
      fieldValues: {},
    })

    expect(result.success).toBe(false)
    expect(result.message).toContain('suspendu')
  })

  it('should return error when user is already confirmed for the tournament', async () => {
    mockRegistrationFindUnique.mockResolvedValue({
      id: REGISTRATION_ID,
      status: RegistrationStatus.CONFIRMED,
      paymentStatus: null,
      paymentRequiredSnapshot: false,
      expiresAt: null,
    })

    const result = await joinTeamAndRegister({
      tournamentId: TOURNAMENT_ID,
      returnPath: RETURN_PATH,
      teamId: TEAM_ID,
      fieldValues: {},
    })

    expect(result.success).toBe(false)
    expect(result.message).toContain('déjà inscrit')
  })
})
