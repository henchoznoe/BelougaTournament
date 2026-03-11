/**
 * File: tests/actions/registrations.test.ts
 * Description: Unit tests for admin registration server actions (delete, update fields, change team, promote captain).
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Role, TournamentFormat } from '@/prisma/generated/prisma/enums'

// ---------------------------------------------------------------------------
// Mocks
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

vi.mock('@/lib/core/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))

vi.mock('next/cache', () => ({
  revalidateTag: vi.fn(),
  cacheLife: vi.fn(),
  cacheTag: vi.fn(),
}))

const mockRegistrationFindUnique = vi.fn()
const mockRegistrationDelete = vi.fn()
const mockRegistrationUpdate = vi.fn()
const mockAdminAssignmentFindUnique = vi.fn()
const mockTeamMemberFindFirst = vi.fn()
const mockTeamFindUnique = vi.fn()

// Transaction mock: executes async callback with a mock tx object
const mockTxTeamMemberDeleteMany = vi.fn()
const mockTxTeamMemberCreate = vi.fn()
const mockTxRegistrationDelete = vi.fn()
const mockTxRegistrationUpdate = vi.fn()
const mockTxRegistrationUpdateMany = vi.fn()
const mockTxTeamUpdate = vi.fn()
const mockTxTeamDelete = vi.fn()

const mockTx = {
  teamMember: {
    deleteMany: (...args: unknown[]) => mockTxTeamMemberDeleteMany(...args),
    create: (...args: unknown[]) => mockTxTeamMemberCreate(...args),
  },
  tournamentRegistration: {
    delete: (...args: unknown[]) => mockTxRegistrationDelete(...args),
    update: (...args: unknown[]) => mockTxRegistrationUpdate(...args),
    updateMany: (...args: unknown[]) => mockTxRegistrationUpdateMany(...args),
  },
  team: {
    update: (...args: unknown[]) => mockTxTeamUpdate(...args),
    delete: (...args: unknown[]) => mockTxTeamDelete(...args),
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
    adminAssignment: {
      findUnique: (...args: unknown[]) =>
        mockAdminAssignmentFindUnique(...args),
    },
    teamMember: {
      findFirst: (...args: unknown[]) => mockTeamMemberFindFirst(...args),
    },
    team: {
      findUnique: (...args: unknown[]) => mockTeamFindUnique(...args),
    },
    $transaction: (...args: unknown[]) => mockTransaction(...(args as [never])),
  },
}))

// ---------------------------------------------------------------------------
// Module under test
// ---------------------------------------------------------------------------

const {
  adminDeleteRegistration,
  adminUpdateRegistrationFields,
  adminChangeTeam,
  adminPromoteCaptain,
} = await import('@/lib/actions/registrations')

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const REG_UUID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
const USER_UUID = 'b1ffc299-9c0b-4ef8-bb6d-6bb9bd380a22'
const TOURN_UUID = 'c2eec399-9c0b-4ef8-bb6d-6bb9bd380a33'
const TEAM_UUID = 'd3ffd499-9c0b-4ef8-bb6d-6bb9bd380a44'
const OTHER_USER_UUID = 'e4eee599-9c0b-4ef8-bb6d-6bb9bd380a55'
const TARGET_TEAM_UUID = 'f5fff699-9c0b-4ef8-bb6d-6bb9bd380a66'

const SUPERADMIN_SESSION = {
  user: {
    id: 'sa-1',
    role: Role.SUPERADMIN,
    email: 'sa@test.com',
    name: 'Super',
  },
  session: {
    id: 'sess-1',
    userId: 'sa-1',
    token: 'tok',
    expiresAt: '2027-01-01',
  },
}

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
    token: 'tok',
    expiresAt: '2027-01-01',
  },
}

const soloRegistration = {
  id: REG_UUID,
  userId: USER_UUID,
  tournament: { id: TOURN_UUID, format: TournamentFormat.SOLO },
  user: { name: 'Alice' },
}

const teamRegistration = {
  id: REG_UUID,
  userId: USER_UUID,
  tournament: { id: TOURN_UUID, format: TournamentFormat.TEAM },
  user: { name: 'Alice' },
}

// ---------------------------------------------------------------------------
// adminDeleteRegistration
// ---------------------------------------------------------------------------

describe('adminDeleteRegistration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetSession.mockResolvedValue(SUPERADMIN_SESSION)
    mockRegistrationDelete.mockResolvedValue({})
    mockTxTeamMemberDeleteMany.mockResolvedValue({})
    mockTxRegistrationDelete.mockResolvedValue({})
    mockTxRegistrationUpdateMany.mockResolvedValue({})
    mockTxTeamUpdate.mockResolvedValue({})
    mockTxTeamDelete.mockResolvedValue({})
  })

  // -------------------------------------------------------------------------
  // Auth & validation
  // -------------------------------------------------------------------------

  it('returns Unauthorized when not authenticated', async () => {
    mockGetSession.mockResolvedValue(null)

    expect(await adminDeleteRegistration({ registrationId: REG_UUID })).toEqual(
      {
        success: false,
        message: 'Unauthorized',
      },
    )
  })

  it('returns Unauthorized when caller is a plain USER', async () => {
    mockGetSession.mockResolvedValue(USER_SESSION)

    expect(await adminDeleteRegistration({ registrationId: REG_UUID })).toEqual(
      {
        success: false,
        message: 'Unauthorized',
      },
    )
  })

  it('returns validation error for invalid UUID', async () => {
    const result = await adminDeleteRegistration({
      registrationId: 'not-a-uuid',
    })

    expect(result.success).toBe(false)
    expect(result.message).toBe('Validation error')
  })

  // -------------------------------------------------------------------------
  // Registration not found
  // -------------------------------------------------------------------------

  it('returns error when registration not found', async () => {
    mockRegistrationFindUnique.mockResolvedValue(null)

    expect(await adminDeleteRegistration({ registrationId: REG_UUID })).toEqual(
      {
        success: false,
        message: 'Inscription introuvable.',
      },
    )
  })

  // -------------------------------------------------------------------------
  // ADMIN assignment checks
  // -------------------------------------------------------------------------

  it('returns error when ADMIN has no tournament assignment', async () => {
    mockGetSession.mockResolvedValue(ADMIN_SESSION)
    mockRegistrationFindUnique.mockResolvedValue(soloRegistration)
    mockAdminAssignmentFindUnique.mockResolvedValue(null)

    expect(await adminDeleteRegistration({ registrationId: REG_UUID })).toEqual(
      {
        success: false,
        message: "Vous n'avez pas accès à ce tournoi.",
      },
    )
  })

  it('allows ADMIN with tournament assignment to delete', async () => {
    mockGetSession.mockResolvedValue(ADMIN_SESSION)
    mockRegistrationFindUnique.mockResolvedValue(soloRegistration)
    mockAdminAssignmentFindUnique.mockResolvedValue({
      adminId: 'admin-1',
      tournamentId: TOURN_UUID,
    })

    const result = await adminDeleteRegistration({ registrationId: REG_UUID })

    expect(result).toEqual({
      success: true,
      message: "L'inscription de Alice a été supprimée.",
    })
    expect(mockAdminAssignmentFindUnique).toHaveBeenCalledWith({
      where: {
        adminId_tournamentId: {
          adminId: 'admin-1',
          tournamentId: TOURN_UUID,
        },
      },
    })
  })

  it('SUPERADMIN bypasses assignment check', async () => {
    mockRegistrationFindUnique.mockResolvedValue(soloRegistration)

    const result = await adminDeleteRegistration({ registrationId: REG_UUID })

    expect(result.success).toBe(true)
    expect(mockAdminAssignmentFindUnique).not.toHaveBeenCalled()
  })

  // -------------------------------------------------------------------------
  // SOLO format deletion
  // -------------------------------------------------------------------------

  it('deletes a SOLO registration and returns success', async () => {
    mockRegistrationFindUnique.mockResolvedValue(soloRegistration)

    const result = await adminDeleteRegistration({ registrationId: REG_UUID })

    expect(result).toEqual({
      success: true,
      message: "L'inscription de Alice a été supprimée.",
    })
    expect(mockRegistrationDelete).toHaveBeenCalledWith({
      where: { id: REG_UUID },
    })
    expect(mockTransaction).not.toHaveBeenCalled()
  })

  // -------------------------------------------------------------------------
  // TEAM format — no team member (edge case)
  // -------------------------------------------------------------------------

  it('handles TEAM registration with no team member (edge case cleanup)', async () => {
    mockRegistrationFindUnique.mockResolvedValue(teamRegistration)
    mockTeamMemberFindFirst.mockResolvedValue(null)

    const result = await adminDeleteRegistration({ registrationId: REG_UUID })

    expect(result).toEqual({
      success: true,
      message: "L'inscription de Alice a été supprimée.",
    })
    expect(mockRegistrationDelete).toHaveBeenCalledWith({
      where: { id: REG_UUID },
    })
    expect(mockTransaction).not.toHaveBeenCalled()
  })

  // -------------------------------------------------------------------------
  // TEAM format — captain with other members (captain succession)
  // -------------------------------------------------------------------------

  it('promotes next member when captain is removed from TEAM', async () => {
    mockRegistrationFindUnique.mockResolvedValue(teamRegistration)
    mockTeamMemberFindFirst.mockResolvedValue({
      userId: USER_UUID,
      team: {
        id: TEAM_UUID,
        captainId: USER_UUID,
        members: [{ userId: USER_UUID }, { userId: OTHER_USER_UUID }],
      },
    })

    const result = await adminDeleteRegistration({ registrationId: REG_UUID })

    expect(result).toEqual({
      success: true,
      message: "L'inscription de Alice a été supprimée.",
    })
    expect(mockTransaction).toHaveBeenCalledOnce()

    // Verify tx operations
    expect(mockTxTeamMemberDeleteMany).toHaveBeenCalledWith({
      where: { teamId: TEAM_UUID, userId: USER_UUID },
    })
    expect(mockTxRegistrationDelete).toHaveBeenCalledWith({
      where: { id: REG_UUID },
    })
    expect(mockTxRegistrationUpdateMany).toHaveBeenCalledWith({
      where: { tournamentId: TOURN_UUID, userId: OTHER_USER_UUID },
      data: { teamId: TEAM_UUID },
    })
    expect(mockTxTeamUpdate).toHaveBeenCalledWith({
      where: { id: TEAM_UUID },
      data: { captainId: OTHER_USER_UUID, isFull: false },
    })
    expect(mockTxTeamDelete).not.toHaveBeenCalled()
  })

  // -------------------------------------------------------------------------
  // TEAM format — last member (team dissolution)
  // -------------------------------------------------------------------------

  it('dissolves team when last member is removed', async () => {
    mockRegistrationFindUnique.mockResolvedValue(teamRegistration)
    mockTeamMemberFindFirst.mockResolvedValue({
      userId: USER_UUID,
      team: {
        id: TEAM_UUID,
        captainId: USER_UUID,
        members: [{ userId: USER_UUID }],
      },
    })

    const result = await adminDeleteRegistration({ registrationId: REG_UUID })

    expect(result).toEqual({
      success: true,
      message: "L'inscription de Alice a été supprimée.",
    })
    expect(mockTransaction).toHaveBeenCalledOnce()

    expect(mockTxTeamMemberDeleteMany).toHaveBeenCalledWith({
      where: { teamId: TEAM_UUID, userId: USER_UUID },
    })
    expect(mockTxRegistrationDelete).toHaveBeenCalledWith({
      where: { id: REG_UUID },
    })
    expect(mockTxTeamDelete).toHaveBeenCalledWith({ where: { id: TEAM_UUID } })
    expect(mockTxTeamUpdate).not.toHaveBeenCalled()
  })

  // -------------------------------------------------------------------------
  // TEAM format — non-captain leaving (isFull = false)
  // -------------------------------------------------------------------------

  it('marks team as not full when non-captain is removed', async () => {
    mockRegistrationFindUnique.mockResolvedValue(teamRegistration)
    mockTeamMemberFindFirst.mockResolvedValue({
      userId: USER_UUID,
      team: {
        id: TEAM_UUID,
        captainId: OTHER_USER_UUID,
        members: [{ userId: OTHER_USER_UUID }, { userId: USER_UUID }],
      },
    })

    const result = await adminDeleteRegistration({ registrationId: REG_UUID })

    expect(result).toEqual({
      success: true,
      message: "L'inscription de Alice a été supprimée.",
    })
    expect(mockTransaction).toHaveBeenCalledOnce()

    expect(mockTxTeamMemberDeleteMany).toHaveBeenCalledWith({
      where: { teamId: TEAM_UUID, userId: USER_UUID },
    })
    expect(mockTxRegistrationDelete).toHaveBeenCalledWith({
      where: { id: REG_UUID },
    })
    expect(mockTxTeamUpdate).toHaveBeenCalledWith({
      where: { id: TEAM_UUID },
      data: { isFull: false },
    })
    expect(mockTxRegistrationUpdateMany).not.toHaveBeenCalled()
    expect(mockTxTeamDelete).not.toHaveBeenCalled()
  })
})

// ---------------------------------------------------------------------------
// adminUpdateRegistrationFields
// ---------------------------------------------------------------------------

describe('adminUpdateRegistrationFields', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetSession.mockResolvedValue(SUPERADMIN_SESSION)
    mockRegistrationUpdate.mockResolvedValue({})
  })

  it('returns Unauthorized when not authenticated', async () => {
    mockGetSession.mockResolvedValue(null)

    const result = await adminUpdateRegistrationFields({
      registrationId: REG_UUID,
      fieldValues: { Pseudo: 'Bob' },
    })
    expect(result).toEqual({ success: false, message: 'Unauthorized' })
  })

  it('returns Unauthorized when caller is a plain USER', async () => {
    mockGetSession.mockResolvedValue(USER_SESSION)

    const result = await adminUpdateRegistrationFields({
      registrationId: REG_UUID,
      fieldValues: { Pseudo: 'Bob' },
    })
    expect(result).toEqual({ success: false, message: 'Unauthorized' })
  })

  it('returns validation error for invalid UUID', async () => {
    const result = await adminUpdateRegistrationFields({
      registrationId: 'bad',
      fieldValues: { Pseudo: 'Bob' },
    })
    expect(result.success).toBe(false)
    expect(result.message).toBe('Validation error')
  })

  it('returns error when registration not found', async () => {
    mockRegistrationFindUnique.mockResolvedValue(null)

    const result = await adminUpdateRegistrationFields({
      registrationId: REG_UUID,
      fieldValues: { Pseudo: 'Bob' },
    })
    expect(result).toEqual({
      success: false,
      message: 'Inscription introuvable.',
    })
  })

  it('returns error when ADMIN has no tournament assignment', async () => {
    mockGetSession.mockResolvedValue(ADMIN_SESSION)
    mockRegistrationFindUnique.mockResolvedValue({
      id: REG_UUID,
      tournament: { id: TOURN_UUID },
      user: { name: 'Alice' },
    })
    mockAdminAssignmentFindUnique.mockResolvedValue(null)

    const result = await adminUpdateRegistrationFields({
      registrationId: REG_UUID,
      fieldValues: { Pseudo: 'Bob' },
    })
    expect(result).toEqual({
      success: false,
      message: "Vous n'avez pas accès à ce tournoi.",
    })
  })

  it('updates field values successfully as SUPERADMIN', async () => {
    mockRegistrationFindUnique.mockResolvedValue({
      id: REG_UUID,
      tournament: { id: TOURN_UUID },
      user: { name: 'Alice' },
    })

    const fieldValues = { Pseudo: 'NewName', ELO: 1800 }
    const result = await adminUpdateRegistrationFields({
      registrationId: REG_UUID,
      fieldValues,
    })

    expect(result).toEqual({
      success: true,
      message: 'Les champs de Alice ont été mis à jour.',
    })
    expect(mockRegistrationUpdate).toHaveBeenCalledWith({
      where: { id: REG_UUID },
      data: { fieldValues },
    })
  })

  it('updates field values successfully as ADMIN with assignment', async () => {
    mockGetSession.mockResolvedValue(ADMIN_SESSION)
    mockRegistrationFindUnique.mockResolvedValue({
      id: REG_UUID,
      tournament: { id: TOURN_UUID },
      user: { name: 'Alice' },
    })
    mockAdminAssignmentFindUnique.mockResolvedValue({
      adminId: 'admin-1',
      tournamentId: TOURN_UUID,
    })

    const result = await adminUpdateRegistrationFields({
      registrationId: REG_UUID,
      fieldValues: { Pseudo: 'Updated' },
    })

    expect(result.success).toBe(true)
    expect(mockAdminAssignmentFindUnique).toHaveBeenCalled()
  })
})

// ---------------------------------------------------------------------------
// adminChangeTeam
// ---------------------------------------------------------------------------

describe('adminChangeTeam', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetSession.mockResolvedValue(SUPERADMIN_SESSION)
    mockTxTeamMemberDeleteMany.mockResolvedValue({})
    mockTxTeamMemberCreate.mockResolvedValue({})
    mockTxRegistrationUpdate.mockResolvedValue({})
    mockTxRegistrationUpdateMany.mockResolvedValue({})
    mockTxTeamUpdate.mockResolvedValue({})
    mockTxTeamDelete.mockResolvedValue({})
  })

  it('returns Unauthorized when not authenticated', async () => {
    mockGetSession.mockResolvedValue(null)

    const result = await adminChangeTeam({
      registrationId: REG_UUID,
      targetTeamId: TARGET_TEAM_UUID,
    })
    expect(result).toEqual({ success: false, message: 'Unauthorized' })
  })

  it('returns Unauthorized when caller is a plain USER', async () => {
    mockGetSession.mockResolvedValue(USER_SESSION)

    const result = await adminChangeTeam({
      registrationId: REG_UUID,
      targetTeamId: TARGET_TEAM_UUID,
    })
    expect(result).toEqual({ success: false, message: 'Unauthorized' })
  })

  it('returns validation error for invalid UUID', async () => {
    const result = await adminChangeTeam({
      registrationId: 'bad',
      targetTeamId: TARGET_TEAM_UUID,
    })
    expect(result.success).toBe(false)
    expect(result.message).toBe('Validation error')
  })

  it('returns error when registration not found', async () => {
    mockRegistrationFindUnique.mockResolvedValue(null)

    const result = await adminChangeTeam({
      registrationId: REG_UUID,
      targetTeamId: TARGET_TEAM_UUID,
    })
    expect(result).toEqual({
      success: false,
      message: 'Inscription introuvable.',
    })
  })

  it('returns error when tournament is SOLO format', async () => {
    mockRegistrationFindUnique.mockResolvedValue(soloRegistration)

    const result = await adminChangeTeam({
      registrationId: REG_UUID,
      targetTeamId: TARGET_TEAM_UUID,
    })
    expect(result).toEqual({
      success: false,
      message: "Ce tournoi n'est pas au format équipe.",
    })
  })

  it('returns error when ADMIN has no tournament assignment', async () => {
    mockGetSession.mockResolvedValue(ADMIN_SESSION)
    mockRegistrationFindUnique.mockResolvedValue(teamRegistration)
    mockAdminAssignmentFindUnique.mockResolvedValue(null)

    const result = await adminChangeTeam({
      registrationId: REG_UUID,
      targetTeamId: TARGET_TEAM_UUID,
    })
    expect(result).toEqual({
      success: false,
      message: "Vous n'avez pas accès à ce tournoi.",
    })
  })

  it('returns error when target team not found', async () => {
    mockRegistrationFindUnique.mockResolvedValue(teamRegistration)
    mockTeamFindUnique.mockResolvedValue(null)

    const result = await adminChangeTeam({
      registrationId: REG_UUID,
      targetTeamId: TARGET_TEAM_UUID,
    })
    expect(result).toEqual({
      success: false,
      message: 'Equipe cible introuvable.',
    })
  })

  it('returns error when target team is in a different tournament', async () => {
    mockRegistrationFindUnique.mockResolvedValue(teamRegistration)
    mockTeamFindUnique.mockResolvedValue({
      id: TARGET_TEAM_UUID,
      name: 'Other',
      tournamentId: 'different-tournament-id',
      isFull: false,
    })

    const result = await adminChangeTeam({
      registrationId: REG_UUID,
      targetTeamId: TARGET_TEAM_UUID,
    })
    expect(result).toEqual({
      success: false,
      message: "L'equipe cible n'appartient pas au même tournoi.",
    })
  })

  it('returns error when target team is full', async () => {
    mockRegistrationFindUnique.mockResolvedValue(teamRegistration)
    mockTeamFindUnique.mockResolvedValue({
      id: TARGET_TEAM_UUID,
      name: 'Full Team',
      tournamentId: TOURN_UUID,
      isFull: true,
    })

    const result = await adminChangeTeam({
      registrationId: REG_UUID,
      targetTeamId: TARGET_TEAM_UUID,
    })
    expect(result).toEqual({
      success: false,
      message: "L'equipe cible est déjà complète.",
    })
  })

  it('returns error when player has no team membership', async () => {
    mockRegistrationFindUnique.mockResolvedValue(teamRegistration)
    mockTeamFindUnique.mockResolvedValue({
      id: TARGET_TEAM_UUID,
      name: 'Target',
      tournamentId: TOURN_UUID,
      isFull: false,
    })
    mockTeamMemberFindFirst.mockResolvedValue(null)

    const result = await adminChangeTeam({
      registrationId: REG_UUID,
      targetTeamId: TARGET_TEAM_UUID,
    })
    expect(result).toEqual({
      success: false,
      message: "Le joueur n'appartient à aucune equipe.",
    })
  })

  it('returns error when player is already in the target team', async () => {
    mockRegistrationFindUnique.mockResolvedValue(teamRegistration)
    mockTeamFindUnique.mockResolvedValue({
      id: TARGET_TEAM_UUID,
      name: 'Target',
      tournamentId: TOURN_UUID,
      isFull: false,
    })
    mockTeamMemberFindFirst.mockResolvedValue({
      userId: USER_UUID,
      team: {
        id: TARGET_TEAM_UUID,
        captainId: OTHER_USER_UUID,
        members: [{ userId: OTHER_USER_UUID }, { userId: USER_UUID }],
      },
    })

    const result = await adminChangeTeam({
      registrationId: REG_UUID,
      targetTeamId: TARGET_TEAM_UUID,
    })
    expect(result).toEqual({
      success: false,
      message: 'Le joueur est déjà dans cette equipe.',
    })
  })

  it('moves non-captain to new team successfully', async () => {
    mockRegistrationFindUnique.mockResolvedValue(teamRegistration)
    mockTeamFindUnique.mockResolvedValue({
      id: TARGET_TEAM_UUID,
      name: 'Target Team',
      tournamentId: TOURN_UUID,
      isFull: false,
    })
    mockTeamMemberFindFirst.mockResolvedValue({
      userId: USER_UUID,
      team: {
        id: TEAM_UUID,
        captainId: OTHER_USER_UUID,
        members: [{ userId: OTHER_USER_UUID }, { userId: USER_UUID }],
      },
    })

    const result = await adminChangeTeam({
      registrationId: REG_UUID,
      targetTeamId: TARGET_TEAM_UUID,
    })

    expect(result).toEqual({
      success: true,
      message: 'Alice a été déplacé vers Target Team.',
    })
    expect(mockTransaction).toHaveBeenCalledOnce()

    // Removed from old team
    expect(mockTxTeamMemberDeleteMany).toHaveBeenCalledWith({
      where: { teamId: TEAM_UUID, userId: USER_UUID },
    })
    // Old team marked not full (non-captain leaving)
    expect(mockTxTeamUpdate).toHaveBeenCalledWith({
      where: { id: TEAM_UUID },
      data: { isFull: false },
    })
    // Added to new team
    expect(mockTxTeamMemberCreate).toHaveBeenCalledWith({
      data: { teamId: TARGET_TEAM_UUID, userId: USER_UUID },
    })
    // No captain succession needed
    expect(mockTxRegistrationUpdateMany).not.toHaveBeenCalled()
  })

  it('handles captain succession when captain is moved to new team', async () => {
    mockRegistrationFindUnique.mockResolvedValue(teamRegistration)
    mockTeamFindUnique.mockResolvedValue({
      id: TARGET_TEAM_UUID,
      name: 'Target Team',
      tournamentId: TOURN_UUID,
      isFull: false,
    })
    mockTeamMemberFindFirst.mockResolvedValue({
      userId: USER_UUID,
      team: {
        id: TEAM_UUID,
        captainId: USER_UUID,
        members: [{ userId: USER_UUID }, { userId: OTHER_USER_UUID }],
      },
    })

    const result = await adminChangeTeam({
      registrationId: REG_UUID,
      targetTeamId: TARGET_TEAM_UUID,
    })

    expect(result.success).toBe(true)
    expect(mockTransaction).toHaveBeenCalledOnce()

    // Removed from old team
    expect(mockTxTeamMemberDeleteMany).toHaveBeenCalledWith({
      where: { teamId: TEAM_UUID, userId: USER_UUID },
    })
    // Clear teamId FK from old captain
    expect(mockTxRegistrationUpdate).toHaveBeenCalledWith({
      where: { id: REG_UUID },
      data: { teamId: null },
    })
    // Promote next member on old team
    expect(mockTxRegistrationUpdateMany).toHaveBeenCalledWith({
      where: { tournamentId: TOURN_UUID, userId: OTHER_USER_UUID },
      data: { teamId: TEAM_UUID },
    })
    expect(mockTxTeamUpdate).toHaveBeenCalledWith({
      where: { id: TEAM_UUID },
      data: { captainId: OTHER_USER_UUID, isFull: false },
    })
    // Added to new team
    expect(mockTxTeamMemberCreate).toHaveBeenCalledWith({
      data: { teamId: TARGET_TEAM_UUID, userId: USER_UUID },
    })
  })

  it('dissolves old team when last member is moved', async () => {
    mockRegistrationFindUnique.mockResolvedValue(teamRegistration)
    mockTeamFindUnique.mockResolvedValue({
      id: TARGET_TEAM_UUID,
      name: 'Target Team',
      tournamentId: TOURN_UUID,
      isFull: false,
    })
    mockTeamMemberFindFirst.mockResolvedValue({
      userId: USER_UUID,
      team: {
        id: TEAM_UUID,
        captainId: USER_UUID,
        members: [{ userId: USER_UUID }],
      },
    })

    const result = await adminChangeTeam({
      registrationId: REG_UUID,
      targetTeamId: TARGET_TEAM_UUID,
    })

    expect(result.success).toBe(true)
    expect(mockTransaction).toHaveBeenCalledOnce()

    // Clear teamId FK before dissolving
    expect(mockTxRegistrationUpdate).toHaveBeenCalledWith({
      where: { id: REG_UUID },
      data: { teamId: null },
    })
    // Dissolve old team
    expect(mockTxTeamDelete).toHaveBeenCalledWith({ where: { id: TEAM_UUID } })
    // Added to new team
    expect(mockTxTeamMemberCreate).toHaveBeenCalledWith({
      data: { teamId: TARGET_TEAM_UUID, userId: USER_UUID },
    })
  })
})

// ---------------------------------------------------------------------------
// adminPromoteCaptain
// ---------------------------------------------------------------------------

describe('adminPromoteCaptain', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetSession.mockResolvedValue(SUPERADMIN_SESSION)
    mockTxRegistrationUpdateMany.mockResolvedValue({})
    mockTxTeamUpdate.mockResolvedValue({})
  })

  it('returns Unauthorized when not authenticated', async () => {
    mockGetSession.mockResolvedValue(null)

    const result = await adminPromoteCaptain({
      teamId: TEAM_UUID,
      userId: USER_UUID,
    })
    expect(result).toEqual({ success: false, message: 'Unauthorized' })
  })

  it('returns Unauthorized when caller is a plain USER', async () => {
    mockGetSession.mockResolvedValue(USER_SESSION)

    const result = await adminPromoteCaptain({
      teamId: TEAM_UUID,
      userId: USER_UUID,
    })
    expect(result).toEqual({ success: false, message: 'Unauthorized' })
  })

  it('returns validation error for invalid UUID', async () => {
    const result = await adminPromoteCaptain({
      teamId: 'bad',
      userId: USER_UUID,
    })
    expect(result.success).toBe(false)
    expect(result.message).toBe('Validation error')
  })

  it('returns error when team not found', async () => {
    mockTeamFindUnique.mockResolvedValue(null)

    const result = await adminPromoteCaptain({
      teamId: TEAM_UUID,
      userId: USER_UUID,
    })
    expect(result).toEqual({ success: false, message: 'Equipe introuvable.' })
  })

  it('returns error when ADMIN has no tournament assignment', async () => {
    mockGetSession.mockResolvedValue(ADMIN_SESSION)
    mockTeamFindUnique.mockResolvedValue({
      id: TEAM_UUID,
      captainId: OTHER_USER_UUID,
      tournamentId: TOURN_UUID,
      members: [{ userId: OTHER_USER_UUID }, { userId: USER_UUID }],
    })
    mockAdminAssignmentFindUnique.mockResolvedValue(null)

    const result = await adminPromoteCaptain({
      teamId: TEAM_UUID,
      userId: USER_UUID,
    })
    expect(result).toEqual({
      success: false,
      message: "Vous n'avez pas accès à ce tournoi.",
    })
  })

  it('returns error when user is not a member of the team', async () => {
    mockTeamFindUnique.mockResolvedValue({
      id: TEAM_UUID,
      captainId: OTHER_USER_UUID,
      tournamentId: TOURN_UUID,
      members: [{ userId: OTHER_USER_UUID }],
    })

    const result = await adminPromoteCaptain({
      teamId: TEAM_UUID,
      userId: USER_UUID,
    })
    expect(result).toEqual({
      success: false,
      message: "L'utilisateur n'est pas membre de cette equipe.",
    })
  })

  it('returns error when user is already captain', async () => {
    mockTeamFindUnique.mockResolvedValue({
      id: TEAM_UUID,
      captainId: USER_UUID,
      tournamentId: TOURN_UUID,
      members: [{ userId: USER_UUID }, { userId: OTHER_USER_UUID }],
    })

    const result = await adminPromoteCaptain({
      teamId: TEAM_UUID,
      userId: USER_UUID,
    })
    expect(result).toEqual({
      success: false,
      message: "L'utilisateur est déjà capitaine.",
    })
  })

  it('promotes member to captain successfully', async () => {
    mockTeamFindUnique.mockResolvedValue({
      id: TEAM_UUID,
      captainId: OTHER_USER_UUID,
      tournamentId: TOURN_UUID,
      members: [{ userId: OTHER_USER_UUID }, { userId: USER_UUID }],
    })

    const result = await adminPromoteCaptain({
      teamId: TEAM_UUID,
      userId: USER_UUID,
    })

    expect(result).toEqual({
      success: true,
      message: 'Le capitaine a été mis à jour.',
    })
    expect(mockTransaction).toHaveBeenCalledOnce()

    // Remove teamId FK from old captain
    expect(mockTxRegistrationUpdateMany).toHaveBeenCalledWith({
      where: { tournamentId: TOURN_UUID, userId: OTHER_USER_UUID },
      data: { teamId: null },
    })
    // Set teamId FK on new captain
    expect(mockTxRegistrationUpdateMany).toHaveBeenCalledWith({
      where: { tournamentId: TOURN_UUID, userId: USER_UUID },
      data: { teamId: TEAM_UUID },
    })
    // Update team captainId
    expect(mockTxTeamUpdate).toHaveBeenCalledWith({
      where: { id: TEAM_UUID },
      data: { captainId: USER_UUID },
    })
  })

  it('allows ADMIN with assignment to promote captain', async () => {
    mockGetSession.mockResolvedValue(ADMIN_SESSION)
    mockTeamFindUnique.mockResolvedValue({
      id: TEAM_UUID,
      captainId: OTHER_USER_UUID,
      tournamentId: TOURN_UUID,
      members: [{ userId: OTHER_USER_UUID }, { userId: USER_UUID }],
    })
    mockAdminAssignmentFindUnique.mockResolvedValue({
      adminId: 'admin-1',
      tournamentId: TOURN_UUID,
    })

    const result = await adminPromoteCaptain({
      teamId: TEAM_UUID,
      userId: USER_UUID,
    })

    expect(result.success).toBe(true)
    expect(mockAdminAssignmentFindUnique).toHaveBeenCalled()
  })
})
