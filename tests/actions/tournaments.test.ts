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
const mockTransaction = vi.fn()
vi.mock('@/lib/core/prisma', () => ({
  default: {
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
} = await import('@/lib/actions/tournaments')

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const VALID_UUID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
const VALID_UUID_2 = 'b1ffcd00-0d1c-4fa9-ac7e-7cc0ce491b22'

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

  it('returns validation error for invalid slug', async () => {
    const result = await createTournament({
      ...VALID_TOURNAMENT_INPUT,
      slug: 'Invalid Slug',
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
})
