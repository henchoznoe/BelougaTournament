/**
 * File: tests/actions/registrations.test.ts
 * Description: Unit tests for admin registration server actions.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  PaymentStatus,
  RegistrationStatus,
  Role,
  TournamentFormat,
} from '@/prisma/generated/prisma/enums'

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

vi.mock('@/lib/core/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))

const mockRefundCreate = vi.fn()
vi.mock('@/lib/core/stripe', () => ({
  getStripe: () => ({
    refunds: {
      create: (...args: unknown[]) => mockRefundCreate(...args),
    },
  }),
}))

vi.mock('next/cache', () => ({
  revalidateTag: vi.fn(),
  cacheLife: vi.fn(),
  cacheTag: vi.fn(),
}))

const mockRegistrationFindUnique = vi.fn()
const mockRegistrationDelete = vi.fn()
const mockRegistrationUpdate = vi.fn()
const mockTeamMemberFindFirst = vi.fn()
const mockTeamFindUnique = vi.fn()

const mockTxTeamMemberDeleteMany = vi.fn()
const mockTxTeamMemberCreate = vi.fn()
const mockTxTeamMemberCount = vi.fn()
const mockTxRegistrationDelete = vi.fn()
const mockTxRegistrationUpdate = vi.fn()
const mockTxTeamUpdate = vi.fn()
const mockTxTeamDelete = vi.fn()
const mockTxPaymentUpdate = vi.fn()

const mockTx = {
  teamMember: {
    deleteMany: (...args: unknown[]) => mockTxTeamMemberDeleteMany(...args),
    create: (...args: unknown[]) => mockTxTeamMemberCreate(...args),
    count: (...args: unknown[]) => mockTxTeamMemberCount(...args),
  },
  tournamentRegistration: {
    delete: (...args: unknown[]) => mockTxRegistrationDelete(...args),
    update: (...args: unknown[]) => mockTxRegistrationUpdate(...args),
  },
  team: {
    update: (...args: unknown[]) => mockTxTeamUpdate(...args),
    delete: (...args: unknown[]) => mockTxTeamDelete(...args),
  },
  payment: {
    update: (...args: unknown[]) => mockTxPaymentUpdate(...args),
  },
}

const mockTransaction = vi.fn(
  async (cb: (tx: typeof mockTx) => Promise<void>) => {
    await cb(mockTx)
  },
)

vi.mock('@/lib/core/prisma', () => ({
  default: {
    tournamentRegistration: {
      findUnique: (...args: unknown[]) => mockRegistrationFindUnique(...args),
      delete: (...args: unknown[]) => mockRegistrationDelete(...args),
      update: (...args: unknown[]) => mockRegistrationUpdate(...args),
    },
    payment: {
      update: (...args: unknown[]) => mockTxPaymentUpdate(...args),
    },
    teamMember: {
      findFirst: (...args: unknown[]) => mockTeamMemberFindFirst(...args),
    },
    team: {
      findUnique: (...args: unknown[]) => mockTeamFindUnique(...args),
      update: (...args: unknown[]) => mockTxTeamUpdate(...args),
    },
    $transaction: (...args: unknown[]) => mockTransaction(...(args as [never])),
  },
}))

const {
  adminDeleteRegistration,
  adminUpdateRegistrationFields,
  adminChangeTeam,
  adminPromoteCaptain,
  adminRefundRegistration,
} = await import('@/lib/actions/registrations')

const REG_UUID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
const USER_UUID = 'b1ffc299-9c0b-4ef8-bb6d-6bb9bd380a22'
const TOURN_UUID = 'c2eec399-9c0b-4ef8-bb6d-6bb9bd380a33'
const TEAM_UUID = 'd3ffd499-9c0b-4ef8-bb6d-6bb9bd380a44'
const TARGET_TEAM_UUID = 'f5fff699-9c0b-4ef8-bb6d-6bb9bd380a66'
const MEMBER_UUID = 'e4eee599-9c0b-4ef8-bb6d-6bb9bd380a55'

const ADMIN_SESSION = {
  user: {
    id: 'admin-1',
    role: Role.ADMIN,
    email: 'admin@test.com',
    name: 'Admin',
  },
  session: {
    id: 'sess-2',
    userId: 'admin-1',
    token: 'tok',
    expiresAt: '2027-01-01',
  },
}

const USER_SESSION = {
  user: {
    id: 'user-1',
    role: Role.USER,
    email: 'user@test.com',
    name: 'User',
  },
  session: {
    id: 'sess-3',
    userId: 'user-1',
    token: 'tok2',
    expiresAt: '2027-01-01',
  },
}

describe('registration admin actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetSession.mockResolvedValue(ADMIN_SESSION)
    mockTxTeamMemberCount.mockResolvedValue(1)
  })

  it('rejects non-admin users for adminDeleteRegistration', async () => {
    mockGetSession.mockResolvedValue(USER_SESSION)

    expect(await adminDeleteRegistration({ registrationId: REG_UUID })).toEqual(
      {
        success: false,
        message: 'Unauthorized',
      },
    )
  })

  it('deletes a solo registration for admins', async () => {
    mockRegistrationFindUnique.mockResolvedValue({
      id: REG_UUID,
      userId: USER_UUID,
      tournament: { id: TOURN_UUID, format: TournamentFormat.SOLO },
      user: { name: 'Alice' },
      paymentRequiredSnapshot: false,
      paymentStatus: PaymentStatus.NOT_REQUIRED,
      payments: [],
    })
    mockRegistrationDelete.mockResolvedValue({})

    expect(await adminDeleteRegistration({ registrationId: REG_UUID })).toEqual(
      {
        success: true,
        message: "L'inscription de Alice a été supprimée.",
      },
    )
  })

  it('updates registration field values for admins', async () => {
    mockRegistrationFindUnique.mockResolvedValue({
      id: REG_UUID,
      tournament: {
        id: TOURN_UUID,
        fields: [{ label: 'Rang', type: 'TEXT', required: false }],
      },
      user: { name: 'Alice' },
    })
    mockRegistrationUpdate.mockResolvedValue({})

    expect(
      await adminUpdateRegistrationFields({
        registrationId: REG_UUID,
        fieldValues: { Rang: 'Diamond' },
      }),
    ).toEqual({
      success: true,
      message: 'Les champs de Alice ont été mis à jour.',
    })
  })

  it('changes a player team for admins', async () => {
    mockRegistrationFindUnique.mockResolvedValue({
      id: REG_UUID,
      userId: USER_UUID,
      status: RegistrationStatus.CONFIRMED,
      tournament: { id: TOURN_UUID, format: TournamentFormat.TEAM },
      user: { name: 'Alice' },
    })
    mockTeamFindUnique.mockResolvedValue({
      id: TARGET_TEAM_UUID,
      name: 'Team Beta',
      tournamentId: TOURN_UUID,
      tournament: { teamSize: 2 },
      _count: { members: 1 },
    })
    mockTeamMemberFindFirst.mockResolvedValue({
      team: {
        id: TEAM_UUID,
        captainId: USER_UUID,
        tournament: { teamSize: 2 },
        members: [{ userId: USER_UUID }, { userId: MEMBER_UUID }],
      },
    })

    expect(
      await adminChangeTeam({
        registrationId: REG_UUID,
        targetTeamId: TARGET_TEAM_UUID,
      }),
    ).toEqual({
      success: true,
      message: 'Alice a été déplacé vers Team Beta.',
    })
  })

  it('promotes a team member to captain for admins', async () => {
    mockTeamFindUnique.mockResolvedValue({
      id: TEAM_UUID,
      captainId: USER_UUID,
      tournamentId: TOURN_UUID,
      members: [{ userId: USER_UUID }, { userId: MEMBER_UUID }],
    })

    expect(
      await adminPromoteCaptain({ teamId: TEAM_UUID, userId: MEMBER_UUID }),
    ).toEqual({ success: true, message: 'Le capitaine a été mis à jour.' })
  })

  it('refunds a paid registration for admins', async () => {
    mockRegistrationFindUnique.mockResolvedValue({
      id: REG_UUID,
      userId: USER_UUID,
      paymentRequiredSnapshot: true,
      paymentStatus: PaymentStatus.PAID,
      payments: [
        {
          id: 'payment-1',
          status: PaymentStatus.PAID,
          amount: 500,
          stripePaymentIntentId: 'pi_123',
          stripeChargeId: 'ch_123',
        },
      ],
      tournament: { id: TOURN_UUID, format: TournamentFormat.SOLO },
      user: { name: 'Alice' },
    })

    expect(await adminRefundRegistration({ registrationId: REG_UUID })).toEqual(
      {
        success: true,
        message: "L'inscription de Alice a été remboursée.",
      },
    )
    expect(mockRefundCreate).toHaveBeenCalledOnce()
  })
})
