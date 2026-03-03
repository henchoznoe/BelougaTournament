/**
 * File: tests/actions/tournaments.test.ts
 * Description: Unit tests for tournament CRUD server actions (ADMIN + SUPERADMIN).
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
const mockFieldDeleteMany = vi.fn()
const mockAssignmentFindUnique = vi.fn()
const mockTransaction = vi.fn()
vi.mock('@/lib/core/prisma', () => ({
  default: {
    tournament: {
      create: (...args: unknown[]) => mockTournamentCreate(...args),
      update: (...args: unknown[]) => mockTournamentUpdate(...args),
      delete: (...args: unknown[]) => mockTournamentDelete(...args),
    },
    tournamentField: {
      deleteMany: (...args: unknown[]) => mockFieldDeleteMany(...args),
    },
    adminAssignment: {
      findUnique: (...args: unknown[]) => mockAssignmentFindUnique(...args),
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
} = await import('@/lib/actions/tournaments')

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const VALID_UUID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'

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
