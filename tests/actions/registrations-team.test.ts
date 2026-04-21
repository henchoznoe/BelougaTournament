/**
 * File: tests/actions/registrations-team.test.ts
 * Description: Unit tests for registrations-team server actions (adminUpdateTeamName, adminDeleteTeamLogo).
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Role } from '@/prisma/generated/prisma/enums'

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

const mockDel = vi.fn()
vi.mock('@vercel/blob', () => ({
  del: (...args: unknown[]) => mockDel(...args),
}))

const mockTeamFindUnique = vi.fn()
const mockTeamFindFirst = vi.fn()
const mockTeamUpdate = vi.fn()

vi.mock('@/lib/core/prisma', () => ({
  default: {
    team: {
      findUnique: (...args: unknown[]) => mockTeamFindUnique(...args),
      findFirst: (...args: unknown[]) => mockTeamFindFirst(...args),
      update: (...args: unknown[]) => mockTeamUpdate(...args),
    },
    $transaction: vi.fn(),
  },
}))

const { adminUpdateTeamName, adminDeleteTeamLogo } = await import(
  '@/lib/actions/registrations-team'
)

const TOURN_UUID = 'c2eec399-9c0b-4ef8-bb6d-6bb9bd380a33'
const TEAM_UUID = 'd3ffd499-9c0b-4ef8-bb6d-6bb9bd380a44'

const ADMIN_SESSION = {
  user: {
    id: 'admin-1',
    role: Role.ADMIN,
    email: 'admin@test.com',
    name: 'Admin',
  },
  session: {
    id: 'sess-1',
    userId: 'admin-1',
    token: 'tok',
    expiresAt: '2027-01-01',
  },
}

const USER_SESSION = {
  user: { id: 'user-1', role: Role.USER, email: 'user@test.com', name: 'User' },
  session: {
    id: 'sess-2',
    userId: 'user-1',
    token: 'tok2',
    expiresAt: '2027-01-01',
  },
}

describe('registrations-team admin actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetSession.mockResolvedValue(ADMIN_SESSION)
  })

  // ---------------------------------------------------------------------------
  // adminUpdateTeamName
  // ---------------------------------------------------------------------------

  describe('adminUpdateTeamName', () => {
    it('rejects non-admin users', async () => {
      mockGetSession.mockResolvedValue(USER_SESSION)

      expect(
        await adminUpdateTeamName({ teamId: TEAM_UUID, name: 'New Name' }),
      ).toEqual({
        success: false,
        message: 'Unauthorized',
      })
    })

    it('returns error when team not found', async () => {
      mockTeamFindUnique.mockResolvedValue(null)

      expect(
        await adminUpdateTeamName({ teamId: TEAM_UUID, name: 'New Name' }),
      ).toEqual({
        success: false,
        message: 'Équipe introuvable.',
      })
    })

    it('returns error when name is already taken in the same tournament', async () => {
      mockTeamFindUnique.mockResolvedValue({
        id: TEAM_UUID,
        tournamentId: TOURN_UUID,
      })
      mockTeamFindFirst.mockResolvedValue({ id: 'other-team-id' })

      expect(
        await adminUpdateTeamName({ teamId: TEAM_UUID, name: 'Taken Name' }),
      ).toEqual({
        success: false,
        message: "Ce nom d'équipe est déjà pris dans ce tournoi.",
      })
    })

    it('renames team successfully when name is available', async () => {
      mockTeamFindUnique.mockResolvedValue({
        id: TEAM_UUID,
        tournamentId: TOURN_UUID,
      })
      mockTeamFindFirst.mockResolvedValue(null)
      mockTeamUpdate.mockResolvedValue({})

      expect(
        await adminUpdateTeamName({ teamId: TEAM_UUID, name: 'Fresh Name' }),
      ).toEqual({
        success: true,
        message: "Le nom de l'équipe a été mis à jour.",
      })
      expect(mockTeamUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ data: { name: 'Fresh Name' } }),
      )
    })
  })

  // ---------------------------------------------------------------------------
  // adminDeleteTeamLogo
  // ---------------------------------------------------------------------------

  describe('adminDeleteTeamLogo', () => {
    it('rejects non-admin users', async () => {
      mockGetSession.mockResolvedValue(USER_SESSION)

      expect(await adminDeleteTeamLogo({ teamId: TEAM_UUID })).toEqual({
        success: false,
        message: 'Unauthorized',
      })
    })

    it('returns error when team not found', async () => {
      mockTeamFindUnique.mockResolvedValue(null)

      expect(await adminDeleteTeamLogo({ teamId: TEAM_UUID })).toEqual({
        success: false,
        message: 'Équipe introuvable.',
      })
    })

    it('returns error when team has no logo', async () => {
      mockTeamFindUnique.mockResolvedValue({ id: TEAM_UUID, logoUrl: null })

      expect(await adminDeleteTeamLogo({ teamId: TEAM_UUID })).toEqual({
        success: false,
        message: 'Aucun logo à supprimer.',
      })
    })

    it('deletes blob and clears logoUrl when logo exists', async () => {
      const LOGO_URL = 'https://blob.vercel-storage.com/logos/team-logo.png'
      mockTeamFindUnique.mockResolvedValue({ id: TEAM_UUID, logoUrl: LOGO_URL })
      mockDel.mockResolvedValue(undefined)
      mockTeamUpdate.mockResolvedValue({})

      expect(await adminDeleteTeamLogo({ teamId: TEAM_UUID })).toEqual({
        success: true,
        message: "Le logo de l'équipe a été supprimé.",
      })
      expect(mockDel).toHaveBeenCalledWith(LOGO_URL)
      expect(mockTeamUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ data: { logoUrl: null } }),
      )
    })

    it('still clears logoUrl even when blob deletion throws', async () => {
      const LOGO_URL = 'https://blob.vercel-storage.com/logos/team-logo.png'
      mockTeamFindUnique.mockResolvedValue({ id: TEAM_UUID, logoUrl: LOGO_URL })
      mockDel.mockRejectedValue(new Error('Blob not found'))
      mockTeamUpdate.mockResolvedValue({})

      expect(await adminDeleteTeamLogo({ teamId: TEAM_UUID })).toEqual({
        success: true,
        message: "Le logo de l'équipe a été supprimé.",
      })
      // DB update still proceeds after blob failure
      expect(mockTeamUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ data: { logoUrl: null } }),
      )
    })
  })
})
