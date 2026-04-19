/**
 * File: tests/utils/team.test.ts
 * Description: Unit tests for team management utilities (syncTeamFullState, handleCaptainSuccession, removeUserFromTeam).
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

import type prisma from '@/lib/core/prisma'
import {
  handleCaptainSuccession,
  removeUserFromTeam,
  syncTeamFullState,
} from '@/lib/utils/team'

// ─── Helpers ─────────────────────────────────────────────────────────────────

type MockTx = Pick<typeof prisma, 'team' | 'teamMember'>

const createMockTx = () => {
  const tx = {
    team: {
      update: vi.fn(),
      delete: vi.fn(),
    },
    teamMember: {
      count: vi.fn(),
      findFirst: vi.fn(),
      deleteMany: vi.fn(),
    },
  }
  return tx as unknown as MockTx & typeof tx
}

const makeMember = (userId: string, joinedAt = new Date()) => ({
  userId,
  joinedAt,
})

const makeTeam = (
  overrides: {
    id?: string
    captainId?: string
    members?: { userId: string; joinedAt: Date }[]
    teamSize?: number
    name?: string
    isFull?: boolean
  } = {},
) => ({
  id: overrides.id ?? 'team-1',
  name: overrides.name ?? 'Team Alpha',
  captainId: overrides.captainId ?? 'user-a',
  isFull: overrides.isFull ?? false,
  members: overrides.members ?? [makeMember('user-a'), makeMember('user-b')],
  tournament: { teamSize: overrides.teamSize ?? 3 },
})

// ─── syncTeamFullState ───────────────────────────────────────────────────────

describe('syncTeamFullState', () => {
  it('sets isFull to true when member count >= teamSize', async () => {
    const tx = createMockTx()
    tx.teamMember.count.mockResolvedValue(3)

    await syncTeamFullState(tx, 'team-1', 3)

    expect(tx.team.update).toHaveBeenCalledWith({
      where: { id: 'team-1' },
      data: { isFull: true },
    })
  })

  it('sets isFull to false when member count < teamSize', async () => {
    const tx = createMockTx()
    tx.teamMember.count.mockResolvedValue(1)

    await syncTeamFullState(tx, 'team-1', 3)

    expect(tx.team.update).toHaveBeenCalledWith({
      where: { id: 'team-1' },
      data: { isFull: false },
    })
  })

  it('sets isFull to true when member count exceeds teamSize', async () => {
    const tx = createMockTx()
    tx.teamMember.count.mockResolvedValue(5)

    await syncTeamFullState(tx, 'team-1', 3)

    expect(tx.team.update).toHaveBeenCalledWith({
      where: { id: 'team-1' },
      data: { isFull: true },
    })
  })
})

// ─── handleCaptainSuccession ─────────────────────────────────────────────────

describe('handleCaptainSuccession', () => {
  it('deletes team when no other members remain', async () => {
    const tx = createMockTx()
    const team = makeTeam({ members: [makeMember('user-a')] })

    await handleCaptainSuccession(tx, team, 'user-a')

    expect(tx.team.delete).toHaveBeenCalledWith({ where: { id: 'team-1' } })
    expect(tx.team.update).not.toHaveBeenCalled()
  })

  it('promotes next member to captain when captain is removed', async () => {
    const tx = createMockTx()
    tx.teamMember.count.mockResolvedValue(1)
    const team = makeTeam({
      captainId: 'user-a',
      members: [
        makeMember('user-a', new Date('2026-01-01')),
        makeMember('user-b', new Date('2026-01-02')),
      ],
    })

    await handleCaptainSuccession(tx, team, 'user-a')

    expect(tx.team.update).toHaveBeenCalledWith({
      where: { id: 'team-1' },
      data: { captainId: 'user-b' },
    })
  })

  it('does not change captain when a non-captain member is removed', async () => {
    const tx = createMockTx()
    tx.teamMember.count.mockResolvedValue(1)
    const team = makeTeam({
      captainId: 'user-a',
      members: [makeMember('user-a'), makeMember('user-b')],
    })

    await handleCaptainSuccession(tx, team, 'user-b')

    // team.update should be called only for syncTeamFullState, not for captainId
    const captainUpdate = tx.team.update.mock.calls.find(
      (call: unknown[]) =>
        (call[0] as { data: { captainId?: string } }).data.captainId !==
        undefined,
    )
    expect(captainUpdate).toBeUndefined()
  })

  it('syncs team full state after succession', async () => {
    const tx = createMockTx()
    tx.teamMember.count.mockResolvedValue(1)
    const team = makeTeam({
      captainId: 'user-a',
      members: [makeMember('user-a'), makeMember('user-b')],
      teamSize: 3,
    })

    await handleCaptainSuccession(tx, team, 'user-a')

    // syncTeamFullState should have been called (via teamMember.count + team.update for isFull)
    expect(tx.teamMember.count).toHaveBeenCalledWith({
      where: { teamId: 'team-1' },
    })
  })
})

// ─── removeUserFromTeam ──────────────────────────────────────────────────────

describe('removeUserFromTeam', () => {
  it('does nothing when user has no team membership', async () => {
    const tx = createMockTx()
    tx.teamMember.findFirst.mockResolvedValue(null)

    await removeUserFromTeam(tx, 'user-x', 'tournament-1')

    expect(tx.teamMember.deleteMany).not.toHaveBeenCalled()
    expect(tx.team.delete).not.toHaveBeenCalled()
  })

  it('deletes team member and handles captain succession', async () => {
    const tx = createMockTx()
    const team = makeTeam({
      captainId: 'user-a',
      members: [makeMember('user-a'), makeMember('user-b')],
      teamSize: 2,
    })
    tx.teamMember.findFirst.mockResolvedValue({
      userId: 'user-a',
      team,
    })
    tx.teamMember.count.mockResolvedValue(1)

    await removeUserFromTeam(tx, 'user-a', 'tournament-1')

    expect(tx.teamMember.deleteMany).toHaveBeenCalledWith({
      where: { teamId: 'team-1', userId: 'user-a' },
    })
    // Captain should be transferred to user-b
    expect(tx.team.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'team-1' },
        data: { captainId: 'user-b' },
      }),
    )
  })

  it('deletes team when last member is removed', async () => {
    const tx = createMockTx()
    const team = makeTeam({
      captainId: 'user-a',
      members: [makeMember('user-a')],
      teamSize: 2,
    })
    tx.teamMember.findFirst.mockResolvedValue({
      userId: 'user-a',
      team,
    })

    await removeUserFromTeam(tx, 'user-a', 'tournament-1')

    expect(tx.teamMember.deleteMany).toHaveBeenCalled()
    expect(tx.team.delete).toHaveBeenCalledWith({ where: { id: 'team-1' } })
  })
})
