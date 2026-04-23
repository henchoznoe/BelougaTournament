/**
 * File: tests/actions/users.test.ts
 * Description: Unit tests for unified user server actions.
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
  TournamentStatus,
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

vi.mock('next/cache', () => ({
  revalidateTag: vi.fn(),
  updateTag: vi.fn(),
  cacheLife: vi.fn(),
  cacheTag: vi.fn(),
}))

const mockIssueStripeRefundAfterDbUpdate = vi.fn()
vi.mock('@/lib/utils/stripe-refund', () => ({
  computeRefundAmount: vi.fn((amount: number) => amount),
  issueStripeRefundAfterDbUpdate: (arg: unknown) =>
    mockIssueStripeRefundAfterDbUpdate(arg),
}))

const mockBuildTeamRevertCallback = vi.fn(
  (_registrationId: unknown, _teamRevertInfo: unknown) => vi.fn(),
)
const mockBuildTeamRevertInfo = vi.fn((_arg: unknown) => ({ teamId: 'team-1' }))
vi.mock('@/lib/utils/team', () => ({
  handleCaptainSuccession: vi.fn().mockResolvedValue(undefined),
  buildTeamRevertCallback: (registrationId: unknown, teamRevertInfo: unknown) =>
    mockBuildTeamRevertCallback(registrationId, teamRevertInfo),
  buildTeamRevertInfo: (arg: unknown) => mockBuildTeamRevertInfo(arg),
  removeUserFromTeam: vi.fn().mockResolvedValue(undefined),
  syncTeamFullState: vi.fn().mockResolvedValue(undefined),
}))

const mockIsRefundEligible = vi.fn(
  (
    _startDate: unknown,
    _refundPolicyType: unknown,
    _refundDeadlineDays: unknown,
    _now: unknown,
  ) => false,
)
vi.mock('@/lib/utils/tournament-helpers', () => ({
  isRefundEligible: (
    startDate: unknown,
    refundPolicyType: unknown,
    refundDeadlineDays: unknown,
    now: unknown,
  ) =>
    mockIsRefundEligible(startDate, refundPolicyType, refundDeadlineDays, now),
  parseFieldValues: vi.fn(v => v),
  validateFieldValues: vi.fn(() => ({ valid: true })),
}))

const mockUserFindUnique = vi.fn()
const mockUserUpdate = vi.fn()
const mockUserDelete = vi.fn()
const mockSessionDeleteMany = vi.fn()
const mockTransaction = vi.fn()
const mockRegistrationFindMany = vi.fn()
const mockTeamMemberFindFirst = vi.fn()
const mockRegistrationDelete = vi.fn()
const mockRegistrationUpdate = vi.fn()

vi.mock('@/lib/core/prisma', () => ({
  default: {
    user: {
      findUnique: (...args: unknown[]) => mockUserFindUnique(...args),
      update: (...args: unknown[]) => mockUserUpdate(...args),
      delete: (...args: unknown[]) => mockUserDelete(...args),
    },
    session: {
      deleteMany: (...args: unknown[]) => mockSessionDeleteMany(...args),
    },
    tournamentRegistration: {
      findMany: (...args: unknown[]) => mockRegistrationFindMany(...args),
      update: (...args: unknown[]) => mockRegistrationUpdate(...args),
      delete: (...args: unknown[]) => mockRegistrationDelete(...args),
    },
    teamMember: {
      findFirst: (...args: unknown[]) => mockTeamMemberFindFirst(...args),
    },
    $transaction: (...args: unknown[]) => mockTransaction(...args),
  },
}))

const {
  promoteToAdmin,
  demoteAdmin,
  updateUser,
  deleteUser,
  banUser,
  unbanUser,
} = await import('@/lib/actions/users')

const VALID_UUID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
const OTHER_UUID = 'b1ffc299-9c0b-4ef8-bb6d-6bb9bd380a22'

const ADMIN_SESSION = {
  user: {
    id: VALID_UUID,
    role: Role.ADMIN,
    email: 'admin@test.com',
    name: 'Admin',
  },
  session: {
    id: 'sess-1',
    userId: VALID_UUID,
    token: 'tok',
    expiresAt: '2027-01-01',
  },
}

const SUPER_ADMIN_SESSION = {
  user: {
    id: VALID_UUID,
    role: Role.SUPER_ADMIN,
    email: 'superadmin@test.com',
    name: 'SuperAdmin',
  },
  session: {
    id: 'sess-sa',
    userId: VALID_UUID,
    token: 'tok',
    expiresAt: '2027-01-01',
  },
}

describe('promoteToAdmin', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetSession.mockResolvedValue(SUPER_ADMIN_SESSION)
    mockTransaction.mockResolvedValue([])
  })

  it('returns Unauthorized when not authenticated', async () => {
    mockGetSession.mockResolvedValue(null)

    expect(await promoteToAdmin({ userId: VALID_UUID })).toEqual({
      success: false,
      message: 'Unauthorized',
    })
  })

  it('rejects non-super-admin callers', async () => {
    mockGetSession.mockResolvedValue(ADMIN_SESSION)

    expect(await promoteToAdmin({ userId: VALID_UUID })).toEqual({
      success: false,
      message: 'Seuls les super admins peuvent modifier les rôles.',
    })
  })

  it('promotes a USER to ADMIN for super admins', async () => {
    mockUserFindUnique.mockResolvedValue({ role: Role.USER, name: 'Alice' })

    const result = await promoteToAdmin({ userId: VALID_UUID })

    expect(result).toEqual({
      success: true,
      message: 'Alice a été promu admin.',
    })
    expect(mockUserUpdate).toHaveBeenCalledWith({
      where: { id: VALID_UUID },
      data: { role: Role.ADMIN },
    })
    expect(mockSessionDeleteMany).toHaveBeenCalledWith({
      where: { userId: VALID_UUID },
    })
  })

  it('returns an error when the target user does not exist', async () => {
    mockUserFindUnique.mockResolvedValue(null)

    expect(await promoteToAdmin({ userId: VALID_UUID })).toEqual({
      success: false,
      message: 'Utilisateur introuvable.',
    })
  })

  it('returns an error when the target user is already an admin', async () => {
    mockUserFindUnique.mockResolvedValue({ role: Role.ADMIN, name: 'Alice' })

    expect(await promoteToAdmin({ userId: VALID_UUID })).toEqual({
      success: false,
      message: 'Alice est déjà admin.',
    })
  })

  it('returns an error when the target user is currently banned', async () => {
    mockUserFindUnique.mockResolvedValue({
      role: Role.USER,
      name: 'Alice',
      bannedAt: new Date('2026-01-01T00:00:00.000Z'),
    })

    expect(await promoteToAdmin({ userId: VALID_UUID })).toEqual({
      success: false,
      message:
        'Alice est actuellement banni. Levez le ban avant de promouvoir.',
    })
  })
})

describe('demoteAdmin', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetSession.mockResolvedValue(SUPER_ADMIN_SESSION)
    mockTransaction.mockResolvedValue([])
  })

  it('prevents self-demotion', async () => {
    mockUserFindUnique.mockResolvedValue({ role: Role.ADMIN, name: 'Admin' })

    expect(await demoteAdmin({ userId: VALID_UUID })).toEqual({
      success: false,
      message: 'Vous ne pouvez pas vous rétrograder.',
    })
  })

  it('demotes an ADMIN to USER for super admins', async () => {
    mockUserFindUnique.mockResolvedValue({ role: Role.ADMIN, name: 'Bob' })

    const result = await demoteAdmin({ userId: OTHER_UUID })

    expect(result).toEqual({ success: true, message: 'Bob a été rétrogradé.' })
    expect(mockUserUpdate).toHaveBeenCalledWith({
      where: { id: OTHER_UUID },
      data: { role: Role.USER },
    })
  })

  it('rejects non-super-admin callers for demotion', async () => {
    mockGetSession.mockResolvedValue(ADMIN_SESSION)

    expect(await demoteAdmin({ userId: OTHER_UUID })).toEqual({
      success: false,
      message: 'Seuls les super admins peuvent modifier les rôles.',
    })
  })

  it('returns an error when the demotion target does not exist', async () => {
    mockUserFindUnique.mockResolvedValue(null)

    expect(await demoteAdmin({ userId: OTHER_UUID })).toEqual({
      success: false,
      message: 'Utilisateur introuvable.',
    })
  })

  it('returns an error when the target is not an admin', async () => {
    mockUserFindUnique.mockResolvedValue({ role: Role.USER, name: 'Bob' })

    expect(await demoteAdmin({ userId: OTHER_UUID })).toEqual({
      success: false,
      message: "Bob n'est pas admin.",
    })
  })
})

describe('updateUser', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetSession.mockResolvedValue(ADMIN_SESSION)
  })

  it('updates a user display name', async () => {
    mockUserFindUnique.mockResolvedValue({ name: 'Carol' })
    mockUserUpdate.mockResolvedValue({})

    const result = await updateUser({
      userId: OTHER_UUID,
      displayName: 'CarolNew',
    })

    expect(result).toEqual({
      success: true,
      message: 'Carol a été mis à jour.',
    })
    expect(mockUserUpdate).toHaveBeenCalledWith({
      where: { id: OTHER_UUID },
      data: { displayName: 'CarolNew' },
    })
  })

  it('returns an error when updating an unknown user', async () => {
    mockUserFindUnique.mockResolvedValue(null)

    expect(
      await updateUser({ userId: OTHER_UUID, displayName: 'CarolNew' }),
    ).toEqual({
      success: false,
      message: 'Utilisateur introuvable.',
    })
  })
})

describe('deleteUser', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetSession.mockResolvedValue(SUPER_ADMIN_SESSION)
  })

  it('rejects non-super-admin callers', async () => {
    mockGetSession.mockResolvedValue(ADMIN_SESSION)

    expect(await deleteUser({ userId: OTHER_UUID })).toEqual({
      success: false,
      message: 'Seuls les super admins peuvent supprimer un utilisateur.',
    })
  })

  it('deletes a USER target for super admins', async () => {
    mockUserFindUnique.mockResolvedValue({ role: Role.USER, name: 'Alice' })
    mockUserDelete.mockResolvedValue({})

    const result = await deleteUser({ userId: OTHER_UUID })

    expect(result).toEqual({
      success: true,
      message: 'Alice a été supprimé définitivement.',
    })
    expect(mockUserDelete).toHaveBeenCalledWith({ where: { id: OTHER_UUID } })
  })

  it('returns an error when the target user does not exist', async () => {
    mockUserFindUnique.mockResolvedValue(null)

    expect(await deleteUser({ userId: OTHER_UUID })).toEqual({
      success: false,
      message: 'Utilisateur introuvable.',
    })
  })

  it('returns an error when attempting to delete an admin', async () => {
    mockUserFindUnique.mockResolvedValue({ role: Role.ADMIN, name: 'Alice' })

    expect(await deleteUser({ userId: OTHER_UUID })).toEqual({
      success: false,
      message:
        "Seuls les utilisateurs avec le rôle Joueur peuvent être supprimés. Rétrogradez d'abord les admins.",
    })
  })

  it('returns an error when attempting to delete yourself', async () => {
    mockUserFindUnique.mockResolvedValue({ role: Role.USER, name: 'Admin' })

    expect(await deleteUser({ userId: VALID_UUID })).toEqual({
      success: false,
      message: 'Vous ne pouvez pas vous supprimer.',
    })
  })
})

describe('banUser', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetSession.mockResolvedValue(ADMIN_SESSION)
    mockTransaction.mockImplementation(
      async (fn: (tx: unknown) => Promise<unknown>) => {
        if (typeof fn === 'function') return fn({})
        return []
      },
    )
    mockRegistrationFindMany.mockResolvedValue([])
  })

  it('prevents self-ban', async () => {
    const result = await banUser({ userId: VALID_UUID, bannedUntil: null })
    expect(result).toEqual({
      success: false,
      message: 'Vous ne pouvez pas vous bannir vous-même.',
    })
  })

  it('returns error for unknown user', async () => {
    mockUserFindUnique.mockResolvedValue(null)
    const result = await banUser({ userId: OTHER_UUID, bannedUntil: null })
    expect(result).toEqual({
      success: false,
      message: 'Utilisateur introuvable.',
    })
  })

  it('refuses to ban an admin', async () => {
    mockUserFindUnique.mockResolvedValue({
      role: Role.ADMIN,
      name: 'Admin2',
      bannedAt: null,
    })
    const result = await banUser({ userId: OTHER_UUID, bannedUntil: null })
    expect(result).toEqual({
      success: false,
      message: 'Impossible de bannir un administrateur.',
    })
  })

  it('refuses to ban a super admin', async () => {
    mockUserFindUnique.mockResolvedValue({
      role: Role.SUPER_ADMIN,
      name: 'Boss',
      bannedAt: null,
    })
    const result = await banUser({ userId: OTHER_UUID, bannedUntil: null })
    expect(result).toEqual({
      success: false,
      message: 'Impossible de bannir un administrateur.',
    })
  })

  it('bans a user permanently with no registrations', async () => {
    mockUserFindUnique.mockResolvedValue({
      role: Role.USER,
      name: 'Bob',
      bannedAt: null,
    })
    mockTransaction.mockResolvedValue([])

    const result = await banUser({ userId: OTHER_UUID, bannedUntil: null })
    expect(result).toEqual({
      success: true,
      message: 'Bob a été banni définitivement.',
    })
  })

  it('bans a user with a fixed date', async () => {
    mockUserFindUnique.mockResolvedValue({
      role: Role.USER,
      name: 'Eve',
      bannedAt: null,
    })
    mockTransaction.mockResolvedValue([])
    const until = '2027-06-01T12:00'

    const result = await banUser({ userId: OTHER_UUID, bannedUntil: until })
    expect(result.success).toBe(true)
    expect(result.message).toContain('Eve')
  })

  it('deletes future free solo registrations while banning a player', async () => {
    mockUserFindUnique.mockResolvedValue({
      role: Role.USER,
      name: 'Bob',
      bannedAt: null,
    })
    mockRegistrationFindMany.mockResolvedValue([
      {
        id: 'reg-free-solo',
        paymentStatus: PaymentStatus.NOT_REQUIRED,
        paymentRequiredSnapshot: false,
        refundDeadlineDaysSnapshot: null,
        teamId: null,
        payments: [],
        tournament: {
          id: 'tournament-1',
          status: TournamentStatus.PUBLISHED,
          format: TournamentFormat.SOLO,
          startDate: new Date('2026-12-01T10:00:00.000Z'),
          refundPolicyType: 'NONE',
          refundDeadlineDays: null,
        },
      },
    ])
    mockTransaction.mockResolvedValue([])

    const result = await banUser({ userId: OTHER_UUID, bannedUntil: null })

    expect(result.success).toBe(true)
    expect(mockRegistrationDelete).toHaveBeenCalledWith({
      where: { id: 'reg-free-solo' },
    })
  })

  it('refunds future paid team registrations while banning a player', async () => {
    mockUserFindUnique.mockResolvedValue({
      role: Role.USER,
      name: 'Bob',
      bannedAt: null,
    })
    mockIsRefundEligible.mockReturnValue(true)
    mockRegistrationFindMany.mockResolvedValue([
      {
        id: 'reg-paid-team',
        paymentStatus: PaymentStatus.PAID,
        paymentRequiredSnapshot: true,
        refundDeadlineDaysSnapshot: 30,
        teamId: 'team-1',
        payments: [
          {
            id: 'pay-1',
            status: PaymentStatus.PAID,
            amount: 1000,
            stripeFee: null,
            donationAmount: null,
            stripePaymentIntentId: 'pi_123',
            stripeChargeId: 'ch_123',
          },
        ],
        tournament: {
          id: 'tournament-1',
          status: TournamentStatus.PUBLISHED,
          format: TournamentFormat.TEAM,
          startDate: new Date('2026-12-01T10:00:00.000Z'),
          refundPolicyType: 'BEFORE_DEADLINE',
          refundDeadlineDays: 30,
        },
      },
    ])
    mockTeamMemberFindFirst.mockResolvedValue({
      joinedAt: new Date('2026-02-01T10:00:00.000Z'),
      team: {
        id: 'team-1',
        captainId: OTHER_UUID,
        name: 'Team One',
        isFull: false,
        tournament: { teamSize: 2 },
        members: [
          {
            userId: OTHER_UUID,
            joinedAt: new Date('2026-02-01T10:00:00.000Z'),
          },
          {
            userId: VALID_UUID,
            joinedAt: new Date('2026-02-02T10:00:00.000Z'),
          },
        ],
      },
    })
    mockTransaction.mockImplementation(async arg => {
      if (typeof arg === 'function') {
        return arg({
          teamMember: {
            deleteMany: vi.fn(),
            count: vi.fn().mockResolvedValue(1),
          },
          tournamentRegistration: { update: mockRegistrationUpdate },
          payment: { update: vi.fn() },
          team: { update: vi.fn(), delete: vi.fn() },
        })
      }

      return []
    })

    const result = await banUser({ userId: OTHER_UUID, bannedUntil: null })

    expect(result.success).toBe(true)
    expect(mockBuildTeamRevertInfo).toHaveBeenCalledOnce()
    expect(mockIssueStripeRefundAfterDbUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        registrationId: 'reg-paid-team',
        idempotencyPrefix: 'ban-refund',
      }),
    )
  })

  it('cancels paid team registrations without refund when they are no longer eligible', async () => {
    mockUserFindUnique.mockResolvedValue({
      role: Role.USER,
      name: 'Bob',
      bannedAt: null,
    })
    mockIsRefundEligible.mockReturnValue(false)
    mockRegistrationFindMany.mockResolvedValue([
      {
        id: 'reg-paid-team-no-refund',
        paymentStatus: PaymentStatus.PAID,
        paymentRequiredSnapshot: true,
        refundDeadlineDaysSnapshot: null,
        teamId: 'team-1',
        payments: [
          {
            id: 'pay-team-no-refund',
            status: PaymentStatus.PAID,
            amount: 1000,
            stripeFee: null,
            donationAmount: null,
            stripePaymentIntentId: 'pi_team_no_refund',
            stripeChargeId: 'ch_team_no_refund',
          },
        ],
        tournament: {
          id: 'tournament-1',
          status: TournamentStatus.PUBLISHED,
          format: TournamentFormat.TEAM,
          startDate: new Date('2026-08-01T10:00:00.000Z'),
          refundPolicyType: 'NONE',
          refundDeadlineDays: null,
        },
      },
    ])
    mockTeamMemberFindFirst.mockResolvedValue({
      joinedAt: new Date('2026-02-01T10:00:00.000Z'),
      team: {
        id: 'team-1',
        captainId: OTHER_UUID,
        name: 'Team One',
        isFull: false,
        tournament: { teamSize: 2 },
        members: [
          {
            userId: OTHER_UUID,
            joinedAt: new Date('2026-02-01T10:00:00.000Z'),
          },
          {
            userId: VALID_UUID,
            joinedAt: new Date('2026-02-02T10:00:00.000Z'),
          },
        ],
      },
    })
    mockTransaction.mockImplementation(async arg => {
      if (typeof arg === 'function') {
        return arg({
          teamMember: {
            deleteMany: vi.fn(),
            count: vi.fn().mockResolvedValue(1),
          },
          tournamentRegistration: { update: mockRegistrationUpdate },
          payment: { update: vi.fn() },
          team: { update: vi.fn(), delete: vi.fn() },
        })
      }

      return []
    })

    const result = await banUser({ userId: OTHER_UUID, bannedUntil: null })

    expect(result.success).toBe(true)
    expect(mockRegistrationUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: RegistrationStatus.CANCELLED }),
      }),
    )
    expect(mockIssueStripeRefundAfterDbUpdate).not.toHaveBeenCalled()
  })

  it('skips team cleanup when a paid team registration has no matching team membership', async () => {
    mockUserFindUnique.mockResolvedValue({
      role: Role.USER,
      name: 'Bob',
      bannedAt: null,
    })
    mockIsRefundEligible.mockReturnValue(true)
    mockRegistrationFindMany.mockResolvedValue([
      {
        id: 'reg-paid-team-no-membership',
        paymentStatus: PaymentStatus.PAID,
        paymentRequiredSnapshot: true,
        refundDeadlineDaysSnapshot: 30,
        teamId: 'team-1',
        payments: [
          {
            id: 'pay-team-no-membership',
            status: PaymentStatus.PAID,
            amount: 1000,
            stripeFee: null,
            donationAmount: null,
            stripePaymentIntentId: 'pi_team_no_membership',
            stripeChargeId: 'ch_team_no_membership',
          },
        ],
        tournament: {
          id: 'tournament-1',
          status: TournamentStatus.PUBLISHED,
          format: TournamentFormat.TEAM,
          startDate: new Date('2026-12-01T10:00:00.000Z'),
          refundPolicyType: 'BEFORE_DEADLINE',
          refundDeadlineDays: 30,
        },
      },
    ])
    mockTeamMemberFindFirst.mockResolvedValue(null)
    mockTransaction.mockResolvedValue([])

    const result = await banUser({ userId: OTHER_UUID, bannedUntil: null })

    expect(result.success).toBe(true)
    expect(mockBuildTeamRevertInfo).not.toHaveBeenCalled()
    expect(mockIssueStripeRefundAfterDbUpdate).not.toHaveBeenCalled()
  })

  it('refunds future paid solo registrations while banning a player', async () => {
    mockUserFindUnique.mockResolvedValue({
      role: Role.USER,
      name: 'Bob',
      bannedAt: null,
    })
    mockIsRefundEligible.mockReturnValue(true)
    mockRegistrationFindMany.mockResolvedValue([
      {
        id: 'reg-paid-solo',
        paymentStatus: PaymentStatus.PAID,
        paymentRequiredSnapshot: true,
        refundDeadlineDaysSnapshot: 30,
        teamId: null,
        payments: [
          {
            id: 'pay-solo',
            status: PaymentStatus.PAID,
            amount: 1000,
            stripeFee: null,
            donationAmount: null,
            stripePaymentIntentId: 'pi_solo',
            stripeChargeId: 'ch_solo',
          },
        ],
        tournament: {
          id: 'tournament-solo',
          status: TournamentStatus.PUBLISHED,
          format: TournamentFormat.SOLO,
          startDate: new Date('2026-12-01T10:00:00.000Z'),
          refundPolicyType: 'BEFORE_DEADLINE',
          refundDeadlineDays: 30,
        },
      },
    ])
    mockTransaction.mockImplementation(async arg => {
      if (typeof arg === 'function') {
        return arg({
          tournamentRegistration: { update: mockRegistrationUpdate },
          payment: { update: vi.fn() },
        })
      }

      return []
    })

    const result = await banUser({ userId: OTHER_UUID, bannedUntil: null })

    expect(result.success).toBe(true)
    expect(mockRegistrationUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'reg-paid-solo' },
        data: expect.objectContaining({
          status: RegistrationStatus.CANCELLED,
        }),
      }),
    )
    expect(mockIssueStripeRefundAfterDbUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        registrationId: 'reg-paid-solo',
        idempotencyPrefix: 'ban-refund',
      }),
    )
  })

  it('cancels future paid solo registrations without refund when outside the refund window', async () => {
    mockUserFindUnique.mockResolvedValue({
      role: Role.USER,
      name: 'Bob',
      bannedAt: null,
    })
    mockIsRefundEligible.mockReturnValue(false)
    mockRegistrationFindMany.mockResolvedValue([
      {
        id: 'reg-paid-solo-no-refund',
        paymentStatus: PaymentStatus.PAID,
        paymentRequiredSnapshot: true,
        refundDeadlineDaysSnapshot: null,
        teamId: null,
        payments: [
          {
            id: 'pay-solo-no-refund',
            status: PaymentStatus.PAID,
            amount: 1000,
            stripeFee: null,
            donationAmount: null,
            stripePaymentIntentId: 'pi_solo_no_refund',
            stripeChargeId: 'ch_solo_no_refund',
          },
        ],
        tournament: {
          id: 'tournament-solo-no-refund',
          status: TournamentStatus.PUBLISHED,
          format: TournamentFormat.SOLO,
          startDate: new Date('2026-08-01T10:00:00.000Z'),
          refundPolicyType: 'NONE',
          refundDeadlineDays: null,
        },
      },
    ])
    mockTransaction.mockImplementation(async arg => {
      if (typeof arg === 'function') {
        return arg({
          tournamentRegistration: { update: mockRegistrationUpdate },
          payment: { update: vi.fn() },
        })
      }

      return []
    })

    const result = await banUser({ userId: OTHER_UUID, bannedUntil: null })

    expect(result.success).toBe(true)
    expect(mockRegistrationUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: RegistrationStatus.CANCELLED }),
      }),
    )
    expect(mockIssueStripeRefundAfterDbUpdate).not.toHaveBeenCalled()
  })

  it('cancels paid team registrations without refund when no latest payment exists', async () => {
    mockUserFindUnique.mockResolvedValue({
      role: Role.USER,
      name: 'Bob',
      bannedAt: null,
    })
    mockIsRefundEligible.mockReturnValue(true)
    mockRegistrationFindMany.mockResolvedValue([
      {
        id: 'reg-paid-team-no-payment',
        paymentStatus: PaymentStatus.PAID,
        paymentRequiredSnapshot: true,
        refundDeadlineDaysSnapshot: 30,
        teamId: 'team-1',
        payments: [],
        tournament: {
          id: 'tournament-1',
          status: TournamentStatus.PUBLISHED,
          format: TournamentFormat.TEAM,
          startDate: new Date('2026-12-01T10:00:00.000Z'),
          refundPolicyType: 'BEFORE_DEADLINE',
          refundDeadlineDays: 30,
        },
      },
    ])
    mockTeamMemberFindFirst.mockResolvedValue({
      joinedAt: new Date('2026-02-01T10:00:00.000Z'),
      team: {
        id: 'team-1',
        captainId: OTHER_UUID,
        name: 'Team One',
        isFull: false,
        tournament: { teamSize: 2 },
        members: [
          {
            userId: OTHER_UUID,
            joinedAt: new Date('2026-02-01T10:00:00.000Z'),
          },
          {
            userId: VALID_UUID,
            joinedAt: new Date('2026-02-02T10:00:00.000Z'),
          },
        ],
      },
    })
    mockTransaction.mockImplementation(async arg => {
      if (typeof arg === 'function') {
        return arg({
          teamMember: {
            deleteMany: vi.fn(),
            count: vi.fn().mockResolvedValue(1),
          },
          tournamentRegistration: { update: mockRegistrationUpdate },
          payment: { update: vi.fn() },
          team: { update: vi.fn(), delete: vi.fn() },
        })
      }

      return []
    })

    const result = await banUser({ userId: OTHER_UUID, bannedUntil: null })

    expect(result.success).toBe(true)
    expect(mockBuildTeamRevertInfo).not.toHaveBeenCalled()
    expect(mockIssueStripeRefundAfterDbUpdate).not.toHaveBeenCalled()
  })
})

describe('unbanUser', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetSession.mockResolvedValue(ADMIN_SESSION)
  })

  it('returns error for unknown user', async () => {
    mockUserFindUnique.mockResolvedValue(null)
    expect(await unbanUser({ userId: OTHER_UUID })).toEqual({
      success: false,
      message: 'Utilisateur introuvable.',
    })
  })

  it('returns error if user is not banned', async () => {
    mockUserFindUnique.mockResolvedValue({ name: 'Alice', bannedAt: null })
    expect(await unbanUser({ userId: OTHER_UUID })).toEqual({
      success: false,
      message: "Alice n'est pas banni.",
    })
  })

  it('lifts a ban successfully', async () => {
    mockUserFindUnique.mockResolvedValue({
      name: 'Alice',
      bannedAt: new Date('2026-01-01'),
    })
    mockUserUpdate.mockResolvedValue({})

    const result = await unbanUser({ userId: OTHER_UUID })
    expect(result).toEqual({
      success: true,
      message: 'Le bannissement de Alice a été levé.',
    })
    expect(mockUserUpdate).toHaveBeenCalledWith({
      where: { id: OTHER_UUID },
      data: { bannedAt: null, bannedUntil: null, banReason: null },
    })
  })
})
