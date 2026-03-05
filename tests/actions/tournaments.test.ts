/**
 * File: tests/actions/tournaments.test.ts
 * Description: Unit tests for tournament CRUD, registration management, and user registration server actions.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Role } from '@/prisma/generated/prisma/enums'

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

const mockRevalidateTag = vi.fn()
vi.mock('next/cache', () => ({
  revalidateTag: (...args: unknown[]) => mockRevalidateTag(...args),
  cacheLife: vi.fn(),
  cacheTag: vi.fn(),
}))

const mockTournamentCreate = vi.fn()
const mockTournamentUpdate = vi.fn()
const mockTournamentDelete = vi.fn()
const mockTournamentFindUnique = vi.fn()
const mockFieldDeleteMany = vi.fn()
const mockAssignmentFindUnique = vi.fn()
const mockRegistrationUpdate = vi.fn()
const mockRegistrationCreate = vi.fn()
const mockRegistrationFindUnique = vi.fn()
const mockRegistrationCount = vi.fn()
const mockTeamCreate = vi.fn()
const mockTeamCount = vi.fn()
const mockTeamFindUnique = vi.fn()
const mockTeamUpdate = vi.fn()
const mockTeamMemberCreate = vi.fn()
const mockUserFindUnique = vi.fn()
const mockTransaction = vi.fn()
vi.mock('@/lib/core/prisma', () => ({
  default: {
    user: {
      findUnique: (...args: unknown[]) => mockUserFindUnique(...args),
    },
    tournament: {
      create: (...args: unknown[]) => mockTournamentCreate(...args),
      update: (...args: unknown[]) => mockTournamentUpdate(...args),
      delete: (...args: unknown[]) => mockTournamentDelete(...args),
      findUnique: (...args: unknown[]) => mockTournamentFindUnique(...args),
    },
    tournamentField: {
      deleteMany: (...args: unknown[]) => mockFieldDeleteMany(...args),
    },
    adminAssignment: {
      findUnique: (...args: unknown[]) => mockAssignmentFindUnique(...args),
    },
    tournamentRegistration: {
      update: (...args: unknown[]) => mockRegistrationUpdate(...args),
      create: (...args: unknown[]) => mockRegistrationCreate(...args),
      findUnique: (...args: unknown[]) => mockRegistrationFindUnique(...args),
      count: (...args: unknown[]) => mockRegistrationCount(...args),
    },
    team: {
      create: (...args: unknown[]) => mockTeamCreate(...args),
      count: (...args: unknown[]) => mockTeamCount(...args),
      findUnique: (...args: unknown[]) => mockTeamFindUnique(...args),
      update: (...args: unknown[]) => mockTeamUpdate(...args),
    },
    teamMember: {
      create: (...args: unknown[]) => mockTeamMemberCreate(...args),
    },
    $transaction: (...args: unknown[]) => mockTransaction(...args),
  },
}))

// ---------------------------------------------------------------------------
// Module under test
// ---------------------------------------------------------------------------

const {
  createTournament,
  updateTournament,
  deleteTournament,
  updateTournamentStatus,
  updateRegistrationStatus,
  registerForTournament,
  createTeamAndRegister,
  joinTeamAndRegister,
  updateRegistrationFields,
} = await import('@/lib/actions/tournaments')

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const VALID_UUID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
const VALID_UUID_2 = 'b1ffcd00-0d1c-4fa9-ac7e-7cc0ce491b22'
const VALID_UUID_3 = 'c2aade11-1e2d-5ab0-bd8f-8dd1df502c33'

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
    token: 'tok2',
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
    token: 'tok3',
    expiresAt: '2027-01-01',
  },
}

const VALID_TOURNAMENT_INPUT = {
  title: 'Valorant Cup',
  slug: 'valorant-cup',
  description: 'Tournoi Valorant 5v5.',
  startDate: '2026-06-15T10:00:00.000Z',
  endDate: '2026-06-17T18:00:00.000Z',
  registrationOpen: '2026-05-01T00:00:00.000Z',
  registrationClose: '2026-06-14T23:59:00.000Z',
  maxTeams: 16,
  format: 'TEAM' as const,
  teamSize: 5,
  game: 'Valorant',
  imageUrl: '',
  rules: 'Double élimination BO3.',
  prize: '500 CHF',
  toornamentId: '',
  streamUrl: '',
  autoApprove: false,
  fields: [
    { label: 'Riot ID', type: 'TEXT' as const, required: true, order: 0 },
  ],
}

// ---------------------------------------------------------------------------
// createTournament
// ---------------------------------------------------------------------------

describe('createTournament', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetSession.mockResolvedValue(SUPERADMIN_SESSION)
    mockTournamentCreate.mockResolvedValue({})
  })

  it('returns Unauthorized when not authenticated', async () => {
    mockGetSession.mockResolvedValue(null)

    expect(await createTournament(VALID_TOURNAMENT_INPUT)).toEqual({
      success: false,
      message: 'Unauthorized',
    })
  })

  it('returns Unauthorized for USER role', async () => {
    mockGetSession.mockResolvedValue(USER_SESSION)

    expect(await createTournament(VALID_TOURNAMENT_INPUT)).toEqual({
      success: false,
      message: 'Unauthorized',
    })
  })

  it('allows ADMIN role to create a tournament', async () => {
    mockGetSession.mockResolvedValue(ADMIN_SESSION)

    const result = await createTournament(VALID_TOURNAMENT_INPUT)

    expect(result).toEqual({
      success: true,
      message: 'Le tournoi a été créé.',
    })
  })

  it('creates a tournament and returns success', async () => {
    const result = await createTournament(VALID_TOURNAMENT_INPUT)

    expect(result).toEqual({
      success: true,
      message: 'Le tournoi a été créé.',
    })
    expect(mockTournamentCreate).toHaveBeenCalledWith({
      data: {
        title: 'Valorant Cup',
        slug: 'valorant-cup',
        description: 'Tournoi Valorant 5v5.',
        startDate: new Date('2026-06-15T10:00:00.000Z'),
        endDate: new Date('2026-06-17T18:00:00.000Z'),
        registrationOpen: new Date('2026-05-01T00:00:00.000Z'),
        registrationClose: new Date('2026-06-14T23:59:00.000Z'),
        maxTeams: 16,
        format: 'TEAM',
        teamSize: 5,
        game: 'Valorant',
        imageUrl: null,
        rules: 'Double élimination BO3.',
        prize: '500 CHF',
        toornamentId: null,
        streamUrl: null,
        autoApprove: false,
        fields: {
          create: [
            { label: 'Riot ID', type: 'TEXT', required: true, order: 0 },
          ],
        },
      },
    })
  })

  it('converts empty optional strings to null', async () => {
    await createTournament(VALID_TOURNAMENT_INPUT)

    const createArg = mockTournamentCreate.mock.calls[0][0]
    expect(createArg.data.imageUrl).toBeNull()
    expect(createArg.data.streamUrl).toBeNull()
    expect(createArg.data.toornamentId).toBeNull()
  })

  it('preserves non-empty optional strings', async () => {
    await createTournament({
      ...VALID_TOURNAMENT_INPUT,
      imageUrl: 'https://example.com/banner.png',
      streamUrl: 'https://twitch.tv/belouga',
      toornamentId: 'toorn-123',
    })

    const createArg = mockTournamentCreate.mock.calls[0][0]
    expect(createArg.data.imageUrl).toBe('https://example.com/banner.png')
    expect(createArg.data.streamUrl).toBe('https://twitch.tv/belouga')
    expect(createArg.data.toornamentId).toBe('toorn-123')
  })

  it('calls revalidateTag for tournaments, tournament-options, and dashboard-stats', async () => {
    await createTournament(VALID_TOURNAMENT_INPUT)

    expect(mockRevalidateTag).toHaveBeenCalledWith('tournaments', 'hours')
    expect(mockRevalidateTag).toHaveBeenCalledWith(
      'tournament-options',
      'minutes',
    )
    expect(mockRevalidateTag).toHaveBeenCalledWith('dashboard-stats', 'minutes')
  })

  it('returns validation error when title is empty', async () => {
    const result = await createTournament({
      ...VALID_TOURNAMENT_INPUT,
      title: '',
    })

    expect(result.success).toBe(false)
    expect(result.message).toBe('Validation error')
  })

  it('returns Internal server error when prisma create throws', async () => {
    mockTournamentCreate.mockRejectedValue(new Error('DB error'))

    const result = await createTournament(VALID_TOURNAMENT_INPUT)

    expect(result).toEqual({ success: false, message: 'Internal server error' })
  })

  it('returns a Prisma error message for P2002 (unique constraint)', async () => {
    const { Prisma } = await import('@/prisma/generated/prisma/client')
    mockTournamentCreate.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('unique constraint', {
        code: 'P2002',
        clientVersion: '7.0.0',
      }),
    )

    const result = await createTournament(VALID_TOURNAMENT_INPUT)

    expect(result).toEqual({
      success: false,
      message: 'This value already exists.',
    })
  })
})

// ---------------------------------------------------------------------------
// updateTournament
// ---------------------------------------------------------------------------

describe('updateTournament', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetSession.mockResolvedValue(SUPERADMIN_SESSION)
    mockTransaction.mockResolvedValue([])
    // Default: existing tournament matches VALID_TOURNAMENT_INPUT
    mockTournamentFindUnique.mockResolvedValue({
      id: VALID_UUID,
      format: 'TEAM',
      status: 'DRAFT',
      fields: [{ label: 'Riot ID', type: 'TEXT', required: true, order: 0 }],
      _count: { registrations: 0 },
    })
  })

  it('returns Unauthorized when not authenticated', async () => {
    mockGetSession.mockResolvedValue(null)

    expect(
      await updateTournament({ ...VALID_TOURNAMENT_INPUT, id: VALID_UUID }),
    ).toEqual({
      success: false,
      message: 'Unauthorized',
    })
  })

  it('returns Unauthorized for USER role', async () => {
    mockGetSession.mockResolvedValue(USER_SESSION)

    expect(
      await updateTournament({ ...VALID_TOURNAMENT_INPUT, id: VALID_UUID }),
    ).toEqual({
      success: false,
      message: 'Unauthorized',
    })
  })

  it('updates a tournament as SUPERADMIN and returns success', async () => {
    const result = await updateTournament({
      ...VALID_TOURNAMENT_INPUT,
      id: VALID_UUID,
    })

    expect(result).toEqual({
      success: true,
      message: 'Le tournoi a été mis à jour.',
    })
    expect(mockTransaction).toHaveBeenCalled()
  })

  it('allows ADMIN with assignment to update', async () => {
    mockGetSession.mockResolvedValue(ADMIN_SESSION)
    mockAssignmentFindUnique.mockResolvedValue({
      id: 'assign-1',
      adminId: 'admin-1',
      tournamentId: VALID_UUID,
    })

    const result = await updateTournament({
      ...VALID_TOURNAMENT_INPUT,
      id: VALID_UUID,
    })

    expect(result).toEqual({
      success: true,
      message: 'Le tournoi a été mis à jour.',
    })
  })

  it('rejects ADMIN without assignment', async () => {
    mockGetSession.mockResolvedValue(ADMIN_SESSION)
    mockAssignmentFindUnique.mockResolvedValue(null)

    const result = await updateTournament({
      ...VALID_TOURNAMENT_INPUT,
      id: VALID_UUID,
    })

    expect(result).toEqual({
      success: false,
      message: "Vous n'avez pas accès à ce tournoi.",
    })
  })

  it('calls revalidateTag for tournaments, tournament-options, and dashboard-upcoming', async () => {
    await updateTournament({
      ...VALID_TOURNAMENT_INPUT,
      id: VALID_UUID,
    })

    expect(mockRevalidateTag).toHaveBeenCalledWith('tournaments', 'hours')
    expect(mockRevalidateTag).toHaveBeenCalledWith(
      'tournament-options',
      'minutes',
    )
    expect(mockRevalidateTag).toHaveBeenCalledWith(
      'dashboard-upcoming',
      'minutes',
    )
  })

  it('returns validation error for invalid id UUID', async () => {
    const result = await updateTournament({
      ...VALID_TOURNAMENT_INPUT,
      id: 'not-a-uuid',
    })

    expect(result.success).toBe(false)
    expect(result.message).toBe('Validation error')
  })

  it('returns Internal server error when transaction throws', async () => {
    mockTransaction.mockRejectedValue(new Error('DB error'))

    const result = await updateTournament({
      ...VALID_TOURNAMENT_INPUT,
      id: VALID_UUID,
    })

    expect(result).toEqual({ success: false, message: 'Internal server error' })
  })

  it('returns error when tournament is not found', async () => {
    mockTournamentFindUnique.mockResolvedValue(null)

    const result = await updateTournament({
      ...VALID_TOURNAMENT_INPUT,
      id: VALID_UUID,
    })

    expect(result).toEqual({
      success: false,
      message: 'Tournoi introuvable.',
    })
    expect(mockTransaction).not.toHaveBeenCalled()
  })

  it('rejects format change (TEAM to SOLO)', async () => {
    const result = await updateTournament({
      ...VALID_TOURNAMENT_INPUT,
      id: VALID_UUID,
      format: 'SOLO',
    })

    expect(result).toEqual({
      success: false,
      message:
        'Le format du tournoi ne peut pas être modifié après la création.',
    })
    expect(mockTransaction).not.toHaveBeenCalled()
  })

  it('rejects format change (SOLO to TEAM)', async () => {
    mockTournamentFindUnique.mockResolvedValue({
      id: VALID_UUID,
      format: 'SOLO',
      status: 'DRAFT',
      fields: [],
      _count: { registrations: 0 },
    })

    const result = await updateTournament({
      ...VALID_TOURNAMENT_INPUT,
      id: VALID_UUID,
      format: 'TEAM',
    })

    expect(result).toEqual({
      success: false,
      message:
        'Le format du tournoi ne peut pas être modifié après la création.',
    })
    expect(mockTransaction).not.toHaveBeenCalled()
  })

  it('rejects field changes when PUBLISHED with registrations', async () => {
    mockTournamentFindUnique.mockResolvedValue({
      id: VALID_UUID,
      format: 'TEAM',
      status: 'PUBLISHED',
      fields: [{ label: 'Riot ID', type: 'TEXT', required: true, order: 0 }],
      _count: { registrations: 5 },
    })

    const result = await updateTournament({
      ...VALID_TOURNAMENT_INPUT,
      id: VALID_UUID,
      fields: [
        { label: 'Discord Tag', type: 'TEXT', required: true, order: 0 },
      ],
    })

    expect(result).toEqual({
      success: false,
      message:
        'Les champs personnalisés ne peuvent pas être modifiés lorsque le tournoi est publié et a des inscriptions.',
    })
    expect(mockTransaction).not.toHaveBeenCalled()
  })

  it('allows field changes when DRAFT', async () => {
    mockTournamentFindUnique.mockResolvedValue({
      id: VALID_UUID,
      format: 'TEAM',
      status: 'DRAFT',
      fields: [{ label: 'Riot ID', type: 'TEXT', required: true, order: 0 }],
      _count: { registrations: 0 },
    })

    const result = await updateTournament({
      ...VALID_TOURNAMENT_INPUT,
      id: VALID_UUID,
      fields: [
        { label: 'Discord Tag', type: 'TEXT', required: true, order: 0 },
      ],
    })

    expect(result).toEqual({
      success: true,
      message: 'Le tournoi a été mis à jour.',
    })
    expect(mockTransaction).toHaveBeenCalled()
  })

  it('allows field changes when PUBLISHED but zero registrations', async () => {
    mockTournamentFindUnique.mockResolvedValue({
      id: VALID_UUID,
      format: 'TEAM',
      status: 'PUBLISHED',
      fields: [{ label: 'Riot ID', type: 'TEXT', required: true, order: 0 }],
      _count: { registrations: 0 },
    })

    const result = await updateTournament({
      ...VALID_TOURNAMENT_INPUT,
      id: VALID_UUID,
      fields: [
        { label: 'Discord Tag', type: 'TEXT', required: true, order: 0 },
      ],
    })

    expect(result).toEqual({
      success: true,
      message: 'Le tournoi a été mis à jour.',
    })
    expect(mockTransaction).toHaveBeenCalled()
  })

  it('allows unchanged fields when PUBLISHED with registrations', async () => {
    mockTournamentFindUnique.mockResolvedValue({
      id: VALID_UUID,
      format: 'TEAM',
      status: 'PUBLISHED',
      fields: [{ label: 'Riot ID', type: 'TEXT', required: true, order: 0 }],
      _count: { registrations: 5 },
    })

    const result = await updateTournament({
      ...VALID_TOURNAMENT_INPUT,
      id: VALID_UUID,
    })

    expect(result).toEqual({
      success: true,
      message: 'Le tournoi a été mis à jour.',
    })
    expect(mockTransaction).toHaveBeenCalled()
  })
})

// ---------------------------------------------------------------------------
// deleteTournament
// ---------------------------------------------------------------------------

describe('deleteTournament', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetSession.mockResolvedValue(SUPERADMIN_SESSION)
    mockTournamentDelete.mockResolvedValue({})
  })

  it('returns Unauthorized when not authenticated', async () => {
    mockGetSession.mockResolvedValue(null)

    expect(await deleteTournament({ id: VALID_UUID })).toEqual({
      success: false,
      message: 'Unauthorized',
    })
  })

  it('returns Unauthorized for USER role', async () => {
    mockGetSession.mockResolvedValue(USER_SESSION)

    expect(await deleteTournament({ id: VALID_UUID })).toEqual({
      success: false,
      message: 'Unauthorized',
    })
  })

  it('deletes a tournament as SUPERADMIN and returns success', async () => {
    const result = await deleteTournament({ id: VALID_UUID })

    expect(result).toEqual({
      success: true,
      message: 'Le tournoi a été supprimé.',
    })
    expect(mockTournamentDelete).toHaveBeenCalledWith({
      where: { id: VALID_UUID },
    })
  })

  it('allows ADMIN with assignment to delete', async () => {
    mockGetSession.mockResolvedValue(ADMIN_SESSION)
    mockAssignmentFindUnique.mockResolvedValue({
      id: 'assign-1',
      adminId: 'admin-1',
      tournamentId: VALID_UUID,
    })

    const result = await deleteTournament({ id: VALID_UUID })

    expect(result).toEqual({
      success: true,
      message: 'Le tournoi a été supprimé.',
    })
  })

  it('rejects ADMIN without assignment', async () => {
    mockGetSession.mockResolvedValue(ADMIN_SESSION)
    mockAssignmentFindUnique.mockResolvedValue(null)

    const result = await deleteTournament({ id: VALID_UUID })

    expect(result).toEqual({
      success: false,
      message: "Vous n'avez pas accès à ce tournoi.",
    })
  })

  it('calls revalidateTag for all relevant tags', async () => {
    await deleteTournament({ id: VALID_UUID })

    expect(mockRevalidateTag).toHaveBeenCalledWith('tournaments', 'hours')
    expect(mockRevalidateTag).toHaveBeenCalledWith(
      'tournament-options',
      'minutes',
    )
    expect(mockRevalidateTag).toHaveBeenCalledWith('dashboard-stats', 'minutes')
    expect(mockRevalidateTag).toHaveBeenCalledWith(
      'dashboard-upcoming',
      'minutes',
    )
    expect(mockRevalidateTag).toHaveBeenCalledWith(
      'dashboard-registrations',
      'minutes',
    )
  })

  it('returns validation error for invalid UUID', async () => {
    const result = await deleteTournament({ id: 'bad-id' })

    expect(result.success).toBe(false)
    expect(result.message).toBe('Validation error')
  })

  it('returns a Prisma error message for P2025 (record not found)', async () => {
    const { Prisma } = await import('@/prisma/generated/prisma/client')
    mockTournamentDelete.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('not found', {
        code: 'P2025',
        clientVersion: '7.0.0',
      }),
    )

    const result = await deleteTournament({ id: VALID_UUID })

    expect(result).toEqual({ success: false, message: 'Record not found.' })
  })
})

// ---------------------------------------------------------------------------
// updateTournamentStatus
// ---------------------------------------------------------------------------

describe('updateTournamentStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetSession.mockResolvedValue(SUPERADMIN_SESSION)
    mockTournamentUpdate.mockResolvedValue({})
  })

  it('returns Unauthorized when not authenticated', async () => {
    mockGetSession.mockResolvedValue(null)

    expect(
      await updateTournamentStatus({ id: VALID_UUID, status: 'PUBLISHED' }),
    ).toEqual({
      success: false,
      message: 'Unauthorized',
    })
  })

  it('returns Unauthorized for USER role', async () => {
    mockGetSession.mockResolvedValue(USER_SESSION)

    expect(
      await updateTournamentStatus({ id: VALID_UUID, status: 'PUBLISHED' }),
    ).toEqual({
      success: false,
      message: 'Unauthorized',
    })
  })

  it('updates status to PUBLISHED as SUPERADMIN', async () => {
    const result = await updateTournamentStatus({
      id: VALID_UUID,
      status: 'PUBLISHED',
    })

    expect(result).toEqual({
      success: true,
      message: 'Le statut du tournoi a été mis à jour.',
    })
    expect(mockTournamentUpdate).toHaveBeenCalledWith({
      where: { id: VALID_UUID },
      data: { status: 'PUBLISHED' },
    })
  })

  it('updates status to ARCHIVED', async () => {
    const result = await updateTournamentStatus({
      id: VALID_UUID,
      status: 'ARCHIVED',
    })

    expect(result).toEqual({
      success: true,
      message: 'Le statut du tournoi a été mis à jour.',
    })
  })

  it('updates status to DRAFT', async () => {
    const result = await updateTournamentStatus({
      id: VALID_UUID,
      status: 'DRAFT',
    })

    expect(result).toEqual({
      success: true,
      message: 'Le statut du tournoi a été mis à jour.',
    })
  })

  it('allows ADMIN with assignment to update status', async () => {
    mockGetSession.mockResolvedValue(ADMIN_SESSION)
    mockAssignmentFindUnique.mockResolvedValue({
      id: 'assign-1',
      adminId: 'admin-1',
      tournamentId: VALID_UUID,
    })

    const result = await updateTournamentStatus({
      id: VALID_UUID,
      status: 'PUBLISHED',
    })

    expect(result).toEqual({
      success: true,
      message: 'Le statut du tournoi a été mis à jour.',
    })
  })

  it('rejects ADMIN without assignment', async () => {
    mockGetSession.mockResolvedValue(ADMIN_SESSION)
    mockAssignmentFindUnique.mockResolvedValue(null)

    const result = await updateTournamentStatus({
      id: VALID_UUID,
      status: 'PUBLISHED',
    })

    expect(result).toEqual({
      success: false,
      message: "Vous n'avez pas accès à ce tournoi.",
    })
  })

  it('calls revalidateTag for relevant tags', async () => {
    await updateTournamentStatus({ id: VALID_UUID, status: 'PUBLISHED' })

    expect(mockRevalidateTag).toHaveBeenCalledWith('tournaments', 'hours')
    expect(mockRevalidateTag).toHaveBeenCalledWith(
      'tournament-options',
      'minutes',
    )
    expect(mockRevalidateTag).toHaveBeenCalledWith('dashboard-stats', 'minutes')
    expect(mockRevalidateTag).toHaveBeenCalledWith(
      'dashboard-upcoming',
      'minutes',
    )
  })

  it('returns validation error for invalid status', async () => {
    const result = await updateTournamentStatus({
      id: VALID_UUID,
      status: 'CANCELLED' as 'DRAFT',
    })

    expect(result.success).toBe(false)
    expect(result.message).toBe('Validation error')
  })

  it('returns validation error for invalid UUID', async () => {
    const result = await updateTournamentStatus({
      id: 'bad-id',
      status: 'DRAFT',
    })

    expect(result.success).toBe(false)
    expect(result.message).toBe('Validation error')
  })

  it('returns Internal server error when prisma update throws', async () => {
    mockTournamentUpdate.mockRejectedValue(new Error('DB error'))

    const result = await updateTournamentStatus({
      id: VALID_UUID,
      status: 'PUBLISHED',
    })

    expect(result).toEqual({ success: false, message: 'Internal server error' })
  })
})

// ---------------------------------------------------------------------------
// updateRegistrationStatus
// ---------------------------------------------------------------------------

describe('updateRegistrationStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetSession.mockResolvedValue(SUPERADMIN_SESSION)
    mockRegistrationUpdate.mockResolvedValue({})
  })

  it('returns Unauthorized when not authenticated', async () => {
    mockGetSession.mockResolvedValue(null)

    expect(
      await updateRegistrationStatus({
        id: VALID_UUID,
        tournamentId: VALID_UUID_2,
        status: 'APPROVED',
      }),
    ).toEqual({
      success: false,
      message: 'Unauthorized',
    })
  })

  it('returns Unauthorized for USER role', async () => {
    mockGetSession.mockResolvedValue(USER_SESSION)

    expect(
      await updateRegistrationStatus({
        id: VALID_UUID,
        tournamentId: VALID_UUID_2,
        status: 'APPROVED',
      }),
    ).toEqual({
      success: false,
      message: 'Unauthorized',
    })
  })

  it('updates registration status to APPROVED as SUPERADMIN', async () => {
    const result = await updateRegistrationStatus({
      id: VALID_UUID,
      tournamentId: VALID_UUID_2,
      status: 'APPROVED',
    })

    expect(result).toEqual({
      success: true,
      message: "Le statut de l'inscription a été mis à jour.",
    })
    expect(mockRegistrationUpdate).toHaveBeenCalledWith({
      where: { id: VALID_UUID },
      data: { status: 'APPROVED' },
    })
  })

  it('updates registration status to REJECTED', async () => {
    const result = await updateRegistrationStatus({
      id: VALID_UUID,
      tournamentId: VALID_UUID_2,
      status: 'REJECTED',
    })

    expect(result).toEqual({
      success: true,
      message: "Le statut de l'inscription a été mis à jour.",
    })
  })

  it('updates registration status to WAITLIST', async () => {
    const result = await updateRegistrationStatus({
      id: VALID_UUID,
      tournamentId: VALID_UUID_2,
      status: 'WAITLIST',
    })

    expect(result).toEqual({
      success: true,
      message: "Le statut de l'inscription a été mis à jour.",
    })
  })

  it('updates registration status to PENDING', async () => {
    const result = await updateRegistrationStatus({
      id: VALID_UUID,
      tournamentId: VALID_UUID_2,
      status: 'PENDING',
    })

    expect(result).toEqual({
      success: true,
      message: "Le statut de l'inscription a été mis à jour.",
    })
  })

  it('allows ADMIN with assignment to update registration status', async () => {
    mockGetSession.mockResolvedValue(ADMIN_SESSION)
    mockAssignmentFindUnique.mockResolvedValue({
      id: 'assign-1',
      adminId: 'admin-1',
      tournamentId: VALID_UUID_2,
    })

    const result = await updateRegistrationStatus({
      id: VALID_UUID,
      tournamentId: VALID_UUID_2,
      status: 'APPROVED',
    })

    expect(result).toEqual({
      success: true,
      message: "Le statut de l'inscription a été mis à jour.",
    })
  })

  it('rejects ADMIN without assignment', async () => {
    mockGetSession.mockResolvedValue(ADMIN_SESSION)
    mockAssignmentFindUnique.mockResolvedValue(null)

    const result = await updateRegistrationStatus({
      id: VALID_UUID,
      tournamentId: VALID_UUID_2,
      status: 'APPROVED',
    })

    expect(result).toEqual({
      success: false,
      message: "Vous n'avez pas accès à ce tournoi.",
    })
  })

  it('calls revalidateTag for tournaments and dashboard-registrations', async () => {
    await updateRegistrationStatus({
      id: VALID_UUID,
      tournamentId: VALID_UUID_2,
      status: 'APPROVED',
    })

    expect(mockRevalidateTag).toHaveBeenCalledWith('tournaments', 'hours')
    expect(mockRevalidateTag).toHaveBeenCalledWith(
      'dashboard-registrations',
      'minutes',
    )
  })

  it('returns validation error for invalid registration id', async () => {
    const result = await updateRegistrationStatus({
      id: 'bad-id',
      tournamentId: VALID_UUID_2,
      status: 'APPROVED',
    })

    expect(result.success).toBe(false)
    expect(result.message).toBe('Validation error')
  })

  it('returns validation error for invalid tournamentId', async () => {
    const result = await updateRegistrationStatus({
      id: VALID_UUID,
      tournamentId: 'bad-id',
      status: 'APPROVED',
    })

    expect(result.success).toBe(false)
    expect(result.message).toBe('Validation error')
  })

  it('returns validation error for invalid status', async () => {
    const result = await updateRegistrationStatus({
      id: VALID_UUID,
      tournamentId: VALID_UUID_2,
      status: 'CANCELLED' as 'APPROVED',
    })

    expect(result.success).toBe(false)
    expect(result.message).toBe('Validation error')
  })

  it('returns Internal server error when prisma update throws', async () => {
    mockRegistrationUpdate.mockRejectedValue(new Error('DB error'))

    const result = await updateRegistrationStatus({
      id: VALID_UUID,
      tournamentId: VALID_UUID_2,
      status: 'APPROVED',
    })

    expect(result).toEqual({ success: false, message: 'Internal server error' })
  })

  it('returns a Prisma error message for P2025 (record not found)', async () => {
    const { Prisma } = await import('@/prisma/generated/prisma/client')
    mockRegistrationUpdate.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('not found', {
        code: 'P2025',
        clientVersion: '7.0.0',
      }),
    )

    const result = await updateRegistrationStatus({
      id: VALID_UUID,
      tournamentId: VALID_UUID_2,
      status: 'APPROVED',
    })

    expect(result).toEqual({ success: false, message: 'Record not found.' })
  })
})

// ---------------------------------------------------------------------------
// registerForTournament
// ---------------------------------------------------------------------------

const MOCK_TOURNAMENT = {
  id: VALID_UUID,
  title: 'Valorant Cup',
  status: 'PUBLISHED',
  format: 'SOLO',
  teamSize: 1,
  registrationOpen: new Date('2025-01-01T00:00:00.000Z'),
  registrationClose: new Date('2027-12-31T23:59:00.000Z'),
  maxTeams: 16,
  autoApprove: false,
  fields: [
    { id: 'f1', label: 'Riot ID', type: 'TEXT', required: true, order: 0 },
    { id: 'f2', label: 'MMR', type: 'NUMBER', required: false, order: 1 },
  ],
}

const VALID_REGISTRATION_INPUT = {
  tournamentId: VALID_UUID,
  fieldValues: { 'Riot ID': 'Player#1234' },
}

describe('registerForTournament', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetSession.mockResolvedValue(USER_SESSION)
    mockUserFindUnique.mockResolvedValue({ bannedUntil: null })
    mockTournamentFindUnique.mockResolvedValue(MOCK_TOURNAMENT)
    mockRegistrationFindUnique.mockResolvedValue(null)
    mockRegistrationCount.mockResolvedValue(0)
    mockRegistrationCreate.mockResolvedValue({})
  })

  it('returns Unauthorized when not authenticated', async () => {
    mockGetSession.mockResolvedValue(null)

    expect(await registerForTournament(VALID_REGISTRATION_INPUT)).toEqual({
      success: false,
      message: 'Unauthorized',
    })
  })

  it('returns error when user is banned', async () => {
    mockUserFindUnique.mockResolvedValue({
      bannedUntil: new Date('2099-12-31T23:59:59.000Z'),
    })

    const result = await registerForTournament(VALID_REGISTRATION_INPUT)

    expect(result).toEqual({
      success: false,
      message: 'Votre compte est banni.',
    })
    expect(mockTournamentFindUnique).not.toHaveBeenCalled()
  })

  it('allows registration when ban has expired', async () => {
    mockUserFindUnique.mockResolvedValue({
      bannedUntil: new Date('2020-01-01T00:00:00.000Z'),
    })

    const result = await registerForTournament(VALID_REGISTRATION_INPUT)

    expect(result).toEqual({
      success: true,
      message: 'Votre inscription a été enregistrée.',
    })
  })

  it('allows USER role to register', async () => {
    const result = await registerForTournament(VALID_REGISTRATION_INPUT)

    expect(result).toEqual({
      success: true,
      message: 'Votre inscription a été enregistrée.',
    })
  })

  it('returns error when tournament is not found', async () => {
    mockTournamentFindUnique.mockResolvedValue(null)

    const result = await registerForTournament(VALID_REGISTRATION_INPUT)

    expect(result).toEqual({
      success: false,
      message: 'Ce tournoi est introuvable ou indisponible.',
    })
  })

  it('returns error when tournament is not PUBLISHED', async () => {
    mockTournamentFindUnique.mockResolvedValue({
      ...MOCK_TOURNAMENT,
      status: 'DRAFT',
    })

    const result = await registerForTournament(VALID_REGISTRATION_INPUT)

    expect(result).toEqual({
      success: false,
      message: 'Ce tournoi est introuvable ou indisponible.',
    })
  })

  it('returns error when registration is not yet open', async () => {
    mockTournamentFindUnique.mockResolvedValue({
      ...MOCK_TOURNAMENT,
      registrationOpen: new Date('2099-01-01T00:00:00.000Z'),
      registrationClose: new Date('2099-12-31T23:59:00.000Z'),
    })

    const result = await registerForTournament(VALID_REGISTRATION_INPUT)

    expect(result).toEqual({
      success: false,
      message: 'Les inscriptions ne sont pas ouvertes.',
    })
  })

  it('returns error when registration is closed', async () => {
    mockTournamentFindUnique.mockResolvedValue({
      ...MOCK_TOURNAMENT,
      registrationOpen: new Date('2020-01-01T00:00:00.000Z'),
      registrationClose: new Date('2020-12-31T23:59:00.000Z'),
    })

    const result = await registerForTournament(VALID_REGISTRATION_INPUT)

    expect(result).toEqual({
      success: false,
      message: 'Les inscriptions ne sont pas ouvertes.',
    })
  })

  it('returns error when tournament is full', async () => {
    mockRegistrationCount.mockResolvedValue(16)

    const result = await registerForTournament(VALID_REGISTRATION_INPUT)

    expect(result).toEqual({
      success: false,
      message: 'Le tournoi est complet.',
    })
  })

  it('skips maxTeams check when maxTeams is null', async () => {
    mockTournamentFindUnique.mockResolvedValue({
      ...MOCK_TOURNAMENT,
      maxTeams: null,
    })

    const result = await registerForTournament(VALID_REGISTRATION_INPUT)

    expect(result.success).toBe(true)
    expect(mockRegistrationCount).not.toHaveBeenCalled()
  })

  it('returns error when user is already registered', async () => {
    mockRegistrationFindUnique.mockResolvedValue({ id: 'existing-reg' })

    const result = await registerForTournament(VALID_REGISTRATION_INPUT)

    expect(result).toEqual({
      success: false,
      message: 'Vous êtes déjà inscrit à ce tournoi.',
    })
  })

  it('returns error when a required field is missing', async () => {
    const result = await registerForTournament({
      tournamentId: VALID_UUID,
      fieldValues: {},
    })

    expect(result).toEqual({
      success: false,
      message: 'Le champ « Riot ID » est requis.',
    })
  })

  it('returns error when a required field is empty string', async () => {
    const result = await registerForTournament({
      tournamentId: VALID_UUID,
      fieldValues: { 'Riot ID': '' },
    })

    expect(result).toEqual({
      success: false,
      message: 'Le champ « Riot ID » est requis.',
    })
  })

  it('returns error when a NUMBER field has a non-number value', async () => {
    const result = await registerForTournament({
      tournamentId: VALID_UUID,
      fieldValues: { 'Riot ID': 'Player#1234', MMR: 'not-a-number' },
    })

    expect(result).toEqual({
      success: false,
      message: 'Le champ « MMR » doit être un nombre.',
    })
  })

  it('creates registration with PENDING status when autoApprove is false', async () => {
    await registerForTournament(VALID_REGISTRATION_INPUT)

    expect(mockRegistrationCreate).toHaveBeenCalledWith({
      data: {
        tournamentId: VALID_UUID,
        userId: 'user-1',
        fieldValues: { 'Riot ID': 'Player#1234' },
        status: 'PENDING',
      },
    })
  })

  it('creates registration with APPROVED status when autoApprove is true', async () => {
    mockTournamentFindUnique.mockResolvedValue({
      ...MOCK_TOURNAMENT,
      autoApprove: true,
    })

    await registerForTournament(VALID_REGISTRATION_INPUT)

    expect(mockRegistrationCreate).toHaveBeenCalledWith({
      data: {
        tournamentId: VALID_UUID,
        userId: 'user-1',
        fieldValues: { 'Riot ID': 'Player#1234' },
        status: 'APPROVED',
      },
    })
  })

  it('calls revalidateTag for tournaments and dashboard-registrations', async () => {
    await registerForTournament(VALID_REGISTRATION_INPUT)

    expect(mockRevalidateTag).toHaveBeenCalledWith('tournaments', 'hours')
    expect(mockRevalidateTag).toHaveBeenCalledWith(
      'dashboard-registrations',
      'minutes',
    )
  })

  it('returns validation error for invalid tournamentId UUID', async () => {
    const result = await registerForTournament({
      tournamentId: 'bad-id',
      fieldValues: {},
    })

    expect(result.success).toBe(false)
    expect(result.message).toBe('Validation error')
  })

  it('returns Internal server error when prisma create throws', async () => {
    mockRegistrationCreate.mockRejectedValue(new Error('DB error'))

    const result = await registerForTournament(VALID_REGISTRATION_INPUT)

    expect(result).toEqual({ success: false, message: 'Internal server error' })
  })

  it('returns a Prisma error message for P2002 (unique constraint — already registered)', async () => {
    const { Prisma } = await import('@/prisma/generated/prisma/client')
    mockRegistrationCreate.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('unique constraint', {
        code: 'P2002',
        clientVersion: '7.0.0',
      }),
    )

    const result = await registerForTournament(VALID_REGISTRATION_INPUT)

    expect(result).toEqual({
      success: false,
      message: 'This value already exists.',
    })
  })

  it('accepts optional NUMBER field with a valid number', async () => {
    const result = await registerForTournament({
      tournamentId: VALID_UUID,
      fieldValues: { 'Riot ID': 'Player#1234', MMR: 2500 },
    })

    expect(result.success).toBe(true)
  })

  it('allows ADMIN role to register', async () => {
    mockGetSession.mockResolvedValue(ADMIN_SESSION)

    const result = await registerForTournament(VALID_REGISTRATION_INPUT)

    expect(result.success).toBe(true)
  })

  it('rejects TEAM format tournaments', async () => {
    mockTournamentFindUnique.mockResolvedValue({
      ...MOCK_TOURNAMENT,
      format: 'TEAM',
    })

    const result = await registerForTournament(VALID_REGISTRATION_INPUT)

    expect(result).toEqual({
      success: false,
      message:
        'Ce tournoi est en format équipe. Utilisez le formulaire équipe.',
    })
  })
})

// ---------------------------------------------------------------------------
// createTeamAndRegister
// ---------------------------------------------------------------------------

const MOCK_TEAM_TOURNAMENT = {
  id: VALID_UUID,
  title: 'Valorant Cup',
  status: 'PUBLISHED',
  format: 'TEAM',
  teamSize: 5,
  registrationOpen: new Date('2025-01-01T00:00:00.000Z'),
  registrationClose: new Date('2027-12-31T23:59:00.000Z'),
  maxTeams: 16,
  autoApprove: false,
  fields: [
    { id: 'f1', label: 'Riot ID', type: 'TEXT', required: true, order: 0 },
  ],
}

const VALID_CREATE_TEAM_INPUT = {
  tournamentId: VALID_UUID,
  teamName: 'Team Alpha',
  fieldValues: { 'Riot ID': 'Player#1234' },
}

describe('createTeamAndRegister', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetSession.mockResolvedValue(USER_SESSION)
    mockUserFindUnique.mockResolvedValue({ bannedUntil: null })
    mockTournamentFindUnique.mockResolvedValue(MOCK_TEAM_TOURNAMENT)
    mockRegistrationFindUnique.mockResolvedValue(null)
    mockTeamCount.mockResolvedValue(0)
    mockTransaction.mockResolvedValue(undefined)
  })

  it('returns Unauthorized when not authenticated', async () => {
    mockGetSession.mockResolvedValue(null)

    expect(await createTeamAndRegister(VALID_CREATE_TEAM_INPUT)).toEqual({
      success: false,
      message: 'Unauthorized',
    })
  })

  it('returns error when user is banned', async () => {
    mockUserFindUnique.mockResolvedValue({
      bannedUntil: new Date('2099-12-31T23:59:59.000Z'),
    })

    const result = await createTeamAndRegister(VALID_CREATE_TEAM_INPUT)

    expect(result).toEqual({
      success: false,
      message: 'Votre compte est banni.',
    })
    expect(mockTournamentFindUnique).not.toHaveBeenCalled()
  })

  it('returns error when tournament is not found', async () => {
    mockTournamentFindUnique.mockResolvedValue(null)

    const result = await createTeamAndRegister(VALID_CREATE_TEAM_INPUT)

    expect(result).toEqual({
      success: false,
      message: 'Ce tournoi est introuvable ou indisponible.',
    })
  })

  it('rejects SOLO format tournaments', async () => {
    mockTournamentFindUnique.mockResolvedValue({
      ...MOCK_TEAM_TOURNAMENT,
      format: 'SOLO',
    })

    const result = await createTeamAndRegister(VALID_CREATE_TEAM_INPUT)

    expect(result).toEqual({
      success: false,
      message: 'Ce tournoi est en format solo. Utilisez le formulaire solo.',
    })
  })

  it('returns error when registration is closed', async () => {
    mockTournamentFindUnique.mockResolvedValue({
      ...MOCK_TEAM_TOURNAMENT,
      registrationOpen: new Date('2020-01-01T00:00:00.000Z'),
      registrationClose: new Date('2020-12-31T23:59:00.000Z'),
    })

    const result = await createTeamAndRegister(VALID_CREATE_TEAM_INPUT)

    expect(result).toEqual({
      success: false,
      message: 'Les inscriptions ne sont pas ouvertes.',
    })
  })

  it('returns error when maxTeams is reached', async () => {
    mockTeamCount.mockResolvedValue(16)

    const result = await createTeamAndRegister(VALID_CREATE_TEAM_INPUT)

    expect(result).toEqual({
      success: false,
      message: "Le nombre maximum d'équipes est atteint.",
    })
  })

  it('returns error when user is already registered', async () => {
    mockRegistrationFindUnique.mockResolvedValue({ id: 'existing-reg' })

    const result = await createTeamAndRegister(VALID_CREATE_TEAM_INPUT)

    expect(result).toEqual({
      success: false,
      message: 'Vous êtes déjà inscrit à ce tournoi.',
    })
  })

  it('returns error when required field is missing', async () => {
    const result = await createTeamAndRegister({
      tournamentId: VALID_UUID,
      teamName: 'Team Alpha',
      fieldValues: {},
    })

    expect(result).toEqual({
      success: false,
      message: 'Le champ « Riot ID » est requis.',
    })
  })

  it('creates team and registration successfully', async () => {
    const result = await createTeamAndRegister(VALID_CREATE_TEAM_INPUT)

    expect(result).toEqual({
      success: true,
      message: 'Votre équipe a été créée et votre inscription enregistrée.',
    })
    expect(mockTransaction).toHaveBeenCalledTimes(1)
  })

  it('calls revalidateTag for tournaments, dashboard-registrations, and dashboard-stats', async () => {
    await createTeamAndRegister(VALID_CREATE_TEAM_INPUT)

    expect(mockRevalidateTag).toHaveBeenCalledWith('tournaments', 'hours')
    expect(mockRevalidateTag).toHaveBeenCalledWith(
      'dashboard-registrations',
      'minutes',
    )
    expect(mockRevalidateTag).toHaveBeenCalledWith('dashboard-stats', 'minutes')
  })

  it('returns validation error for invalid tournamentId', async () => {
    const result = await createTeamAndRegister({
      ...VALID_CREATE_TEAM_INPUT,
      tournamentId: 'bad-id',
    })

    expect(result.success).toBe(false)
    expect(result.message).toBe('Validation error')
  })

  it('returns validation error when team name is too short', async () => {
    const result = await createTeamAndRegister({
      ...VALID_CREATE_TEAM_INPUT,
      teamName: 'A',
    })

    expect(result.success).toBe(false)
    expect(result.message).toBe('Validation error')
  })
})

// ---------------------------------------------------------------------------
// joinTeamAndRegister
// ---------------------------------------------------------------------------

const MOCK_TEAM = {
  id: VALID_UUID_2,
  tournamentId: VALID_UUID,
  isFull: false,
  _count: { members: 2 },
}

const VALID_JOIN_TEAM_INPUT = {
  tournamentId: VALID_UUID,
  teamId: VALID_UUID_2,
  fieldValues: { 'Riot ID': 'Player#5678' },
}

describe('joinTeamAndRegister', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetSession.mockResolvedValue(USER_SESSION)
    mockUserFindUnique.mockResolvedValue({ bannedUntil: null })
    mockTournamentFindUnique.mockResolvedValue(MOCK_TEAM_TOURNAMENT)
    mockRegistrationFindUnique.mockResolvedValue(null)
    mockTeamFindUnique.mockResolvedValue(MOCK_TEAM)
    mockTransaction.mockResolvedValue(undefined)
  })

  it('returns Unauthorized when not authenticated', async () => {
    mockGetSession.mockResolvedValue(null)

    expect(await joinTeamAndRegister(VALID_JOIN_TEAM_INPUT)).toEqual({
      success: false,
      message: 'Unauthorized',
    })
  })

  it('returns error when user is banned', async () => {
    mockUserFindUnique.mockResolvedValue({
      bannedUntil: new Date('2099-12-31T23:59:59.000Z'),
    })

    const result = await joinTeamAndRegister(VALID_JOIN_TEAM_INPUT)

    expect(result).toEqual({
      success: false,
      message: 'Votre compte est banni.',
    })
    expect(mockTournamentFindUnique).not.toHaveBeenCalled()
  })

  it('returns error when tournament is not found', async () => {
    mockTournamentFindUnique.mockResolvedValue(null)

    const result = await joinTeamAndRegister(VALID_JOIN_TEAM_INPUT)

    expect(result).toEqual({
      success: false,
      message: 'Ce tournoi est introuvable ou indisponible.',
    })
  })

  it('rejects SOLO format tournaments', async () => {
    mockTournamentFindUnique.mockResolvedValue({
      ...MOCK_TEAM_TOURNAMENT,
      format: 'SOLO',
    })

    const result = await joinTeamAndRegister(VALID_JOIN_TEAM_INPUT)

    expect(result).toEqual({
      success: false,
      message: 'Ce tournoi est en format solo. Utilisez le formulaire solo.',
    })
  })

  it('returns error when registration is closed', async () => {
    mockTournamentFindUnique.mockResolvedValue({
      ...MOCK_TEAM_TOURNAMENT,
      registrationOpen: new Date('2020-01-01T00:00:00.000Z'),
      registrationClose: new Date('2020-12-31T23:59:00.000Z'),
    })

    const result = await joinTeamAndRegister(VALID_JOIN_TEAM_INPUT)

    expect(result).toEqual({
      success: false,
      message: 'Les inscriptions ne sont pas ouvertes.',
    })
  })

  it('returns error when user is already registered', async () => {
    mockRegistrationFindUnique.mockResolvedValue({ id: 'existing-reg' })

    const result = await joinTeamAndRegister(VALID_JOIN_TEAM_INPUT)

    expect(result).toEqual({
      success: false,
      message: 'Vous êtes déjà inscrit à ce tournoi.',
    })
  })

  it('returns error when team is not found', async () => {
    mockTeamFindUnique.mockResolvedValue(null)

    const result = await joinTeamAndRegister(VALID_JOIN_TEAM_INPUT)

    expect(result).toEqual({
      success: false,
      message: 'Équipe introuvable.',
    })
  })

  it('returns error when team belongs to a different tournament', async () => {
    mockTeamFindUnique.mockResolvedValue({
      ...MOCK_TEAM,
      tournamentId: 'c2ggde11-1e2d-5gb0-bd8f-8dd1df602c33',
    })

    const result = await joinTeamAndRegister(VALID_JOIN_TEAM_INPUT)

    expect(result).toEqual({
      success: false,
      message: 'Équipe introuvable.',
    })
  })

  it('returns error when team is full', async () => {
    mockTeamFindUnique.mockResolvedValue({
      ...MOCK_TEAM,
      isFull: true,
    })

    const result = await joinTeamAndRegister(VALID_JOIN_TEAM_INPUT)

    expect(result).toEqual({
      success: false,
      message: 'Cette équipe est complète.',
    })
  })

  it('returns error when required field is missing', async () => {
    const result = await joinTeamAndRegister({
      tournamentId: VALID_UUID,
      teamId: VALID_UUID_2,
      fieldValues: {},
    })

    expect(result).toEqual({
      success: false,
      message: 'Le champ « Riot ID » est requis.',
    })
  })

  it('joins team and registers successfully', async () => {
    const result = await joinTeamAndRegister(VALID_JOIN_TEAM_INPUT)

    expect(result).toEqual({
      success: true,
      message:
        "Vous avez rejoint l'équipe et votre inscription a été enregistrée.",
    })
    expect(mockTransaction).toHaveBeenCalledTimes(1)
  })

  it('calls revalidateTag for tournaments, dashboard-registrations, and dashboard-stats', async () => {
    await joinTeamAndRegister(VALID_JOIN_TEAM_INPUT)

    expect(mockRevalidateTag).toHaveBeenCalledWith('tournaments', 'hours')
    expect(mockRevalidateTag).toHaveBeenCalledWith(
      'dashboard-registrations',
      'minutes',
    )
    expect(mockRevalidateTag).toHaveBeenCalledWith('dashboard-stats', 'minutes')
  })

  it('returns validation error for invalid tournamentId', async () => {
    const result = await joinTeamAndRegister({
      ...VALID_JOIN_TEAM_INPUT,
      tournamentId: 'bad-id',
    })

    expect(result.success).toBe(false)
    expect(result.message).toBe('Validation error')
  })

  it('returns validation error for invalid teamId', async () => {
    const result = await joinTeamAndRegister({
      ...VALID_JOIN_TEAM_INPUT,
      teamId: 'bad-id',
    })

    expect(result.success).toBe(false)
    expect(result.message).toBe('Validation error')
  })
})

// ---------------------------------------------------------------------------
// updateRegistrationFields
// ---------------------------------------------------------------------------

const MOCK_REGISTRATION = {
  id: VALID_UUID_3,
  userId: 'user-1',
  tournamentId: VALID_UUID,
  status: 'PENDING',
  fieldValues: { 'Riot ID': 'OldPlayer#0000' },
  tournament: {
    ...MOCK_TOURNAMENT,
    fields: [
      { id: 'f1', label: 'Riot ID', type: 'TEXT', required: true, order: 0 },
      { id: 'f2', label: 'MMR', type: 'NUMBER', required: false, order: 1 },
    ],
  },
}

const VALID_UPDATE_FIELDS_INPUT = {
  registrationId: VALID_UUID_3,
  tournamentId: VALID_UUID,
  fieldValues: { 'Riot ID': 'NewPlayer#5678' },
}

describe('updateRegistrationFields', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetSession.mockResolvedValue(USER_SESSION)
    mockRegistrationFindUnique.mockResolvedValue(MOCK_REGISTRATION)
    mockRegistrationUpdate.mockResolvedValue({})
  })

  it('returns Unauthorized when not authenticated', async () => {
    mockGetSession.mockResolvedValue(null)

    expect(await updateRegistrationFields(VALID_UPDATE_FIELDS_INPUT)).toEqual({
      success: false,
      message: 'Unauthorized',
    })
  })

  it('returns error when registration is not found', async () => {
    mockRegistrationFindUnique.mockResolvedValue(null)

    const result = await updateRegistrationFields(VALID_UPDATE_FIELDS_INPUT)

    expect(result).toEqual({
      success: false,
      message: 'Inscription introuvable.',
    })
  })

  it('returns error when user does not own the registration', async () => {
    mockRegistrationFindUnique.mockResolvedValue({
      ...MOCK_REGISTRATION,
      userId: 'other-user',
    })

    const result = await updateRegistrationFields(VALID_UPDATE_FIELDS_INPUT)

    expect(result).toEqual({
      success: false,
      message: "Vous ne pouvez pas modifier l'inscription d'un autre joueur.",
    })
  })

  it('returns error when tournamentId does not match', async () => {
    mockRegistrationFindUnique.mockResolvedValue({
      ...MOCK_REGISTRATION,
      tournamentId: VALID_UUID_2,
    })

    const result = await updateRegistrationFields(VALID_UPDATE_FIELDS_INPUT)

    expect(result).toEqual({
      success: false,
      message: 'ID de tournoi invalide.',
    })
  })

  it('returns error when tournament is not PUBLISHED', async () => {
    mockRegistrationFindUnique.mockResolvedValue({
      ...MOCK_REGISTRATION,
      tournament: { ...MOCK_REGISTRATION.tournament, status: 'ARCHIVED' },
    })

    const result = await updateRegistrationFields(VALID_UPDATE_FIELDS_INPUT)

    expect(result).toEqual({
      success: false,
      message: 'Ce tournoi est introuvable ou indisponible.',
    })
  })

  it('returns error when a required field is missing', async () => {
    const result = await updateRegistrationFields({
      ...VALID_UPDATE_FIELDS_INPUT,
      fieldValues: {},
    })

    expect(result).toEqual({
      success: false,
      message: 'Le champ « Riot ID » est requis.',
    })
  })

  it('returns error when a required field is empty string', async () => {
    const result = await updateRegistrationFields({
      ...VALID_UPDATE_FIELDS_INPUT,
      fieldValues: { 'Riot ID': '' },
    })

    expect(result).toEqual({
      success: false,
      message: 'Le champ « Riot ID » est requis.',
    })
  })

  it('returns error when NUMBER field receives a non-number value', async () => {
    const result = await updateRegistrationFields({
      ...VALID_UPDATE_FIELDS_INPUT,
      fieldValues: {
        'Riot ID': 'Player#1234',
        MMR: 'not-a-number' as unknown as number,
      },
    })

    expect(result).toEqual({
      success: false,
      message: 'Le champ « MMR » doit être un nombre.',
    })
  })

  it('updates fields and keeps PENDING status unchanged', async () => {
    const result = await updateRegistrationFields(VALID_UPDATE_FIELDS_INPUT)

    expect(result).toEqual({
      success: true,
      message: 'Votre inscription a été mise à jour.',
    })
    expect(mockRegistrationUpdate).toHaveBeenCalledWith({
      where: { id: VALID_UUID_3 },
      data: {
        fieldValues: VALID_UPDATE_FIELDS_INPUT.fieldValues,
        status: 'PENDING',
      },
    })
  })

  it('resets APPROVED status to PENDING and appends message', async () => {
    mockRegistrationFindUnique.mockResolvedValue({
      ...MOCK_REGISTRATION,
      status: 'APPROVED',
    })

    const result = await updateRegistrationFields(VALID_UPDATE_FIELDS_INPUT)

    expect(result).toEqual({
      success: true,
      message:
        'Votre inscription a été mise à jour. Votre inscription a été remise en attente de validation.',
    })
    expect(mockRegistrationUpdate).toHaveBeenCalledWith({
      where: { id: VALID_UUID_3 },
      data: {
        fieldValues: VALID_UPDATE_FIELDS_INPUT.fieldValues,
        status: 'PENDING',
      },
    })
  })

  it('keeps REJECTED status unchanged', async () => {
    mockRegistrationFindUnique.mockResolvedValue({
      ...MOCK_REGISTRATION,
      status: 'REJECTED',
    })

    const result = await updateRegistrationFields(VALID_UPDATE_FIELDS_INPUT)

    expect(result).toEqual({
      success: true,
      message: 'Votre inscription a été mise à jour.',
    })
    expect(mockRegistrationUpdate).toHaveBeenCalledWith({
      where: { id: VALID_UUID_3 },
      data: {
        fieldValues: VALID_UPDATE_FIELDS_INPUT.fieldValues,
        status: 'REJECTED',
      },
    })
  })

  it('revalidates correct cache tags', async () => {
    await updateRegistrationFields(VALID_UPDATE_FIELDS_INPUT)

    expect(mockRevalidateTag).toHaveBeenCalledWith('tournaments', 'hours')
    expect(mockRevalidateTag).toHaveBeenCalledWith(
      'dashboard-registrations',
      'minutes',
    )
    expect(mockRevalidateTag).toHaveBeenCalledWith('dashboard-stats', 'minutes')
  })

  it('accepts optional NUMBER field with valid number', async () => {
    const result = await updateRegistrationFields({
      ...VALID_UPDATE_FIELDS_INPUT,
      fieldValues: { 'Riot ID': 'Player#1234', MMR: 1500 },
    })

    expect(result.success).toBe(true)
  })

  it('returns validation error for invalid registrationId', async () => {
    const result = await updateRegistrationFields({
      ...VALID_UPDATE_FIELDS_INPUT,
      registrationId: 'bad-id',
    })

    expect(result.success).toBe(false)
    expect(result.message).toBe('Validation error')
  })

  it('returns validation error for invalid tournamentId', async () => {
    const result = await updateRegistrationFields({
      ...VALID_UPDATE_FIELDS_INPUT,
      tournamentId: 'bad-id',
    })

    expect(result.success).toBe(false)
    expect(result.message).toBe('Validation error')
  })
})
