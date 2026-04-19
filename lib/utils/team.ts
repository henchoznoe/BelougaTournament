/**
 * File: lib/utils/team.ts
 * Description: Shared team management utilities used by server actions and webhook handlers.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import 'server-only'
import type prisma from '@/lib/core/prisma'
import type { TeamMemberWithTeam, TeamWithMembers } from '@/lib/types/team'

/** Recomputes the `isFull` flag for a team after a membership mutation. */
export const syncTeamFullState = async (
  tx: Pick<typeof prisma, 'team' | 'teamMember'>,
  teamId: string,
  teamSize: number,
): Promise<void> => {
  const memberCount = await tx.teamMember.count({ where: { teamId } })

  await tx.team.update({
    where: { id: teamId },
    data: { isFull: memberCount >= teamSize },
  })
}

/**
 * Handles captain succession and team cleanup after a member has been deleted.
 * Call this AFTER deleting the teamMember row from the database.
 * If no other members remain, the team is deleted.
 * If the removed user was captain, the earliest-joined remaining member is promoted.
 */
export const handleCaptainSuccession = async (
  tx: Pick<typeof prisma, 'team' | 'teamMember'>,
  team: TeamWithMembers,
  removedUserId: string,
): Promise<void> => {
  const otherMembers = team.members.filter(m => m.userId !== removedUserId)

  if (otherMembers.length === 0) {
    await tx.team.delete({ where: { id: team.id } })
    return
  }

  if (team.captainId === removedUserId) {
    await tx.team.update({
      where: { id: team.id },
      data: { captainId: otherMembers[0].userId },
    })
  }

  await syncTeamFullState(tx, team.id, team.tournament.teamSize)
}

/** Removes a user from their team while keeping the registration row intact. */
export const removeUserFromTeam = async (
  tx: Pick<typeof prisma, 'team' | 'teamMember'>,
  userId: string,
  tournamentId: string,
): Promise<void> => {
  const teamMember = (await tx.teamMember.findFirst({
    where: { userId, team: { tournamentId } },
    include: {
      team: {
        include: {
          tournament: { select: { teamSize: true } },
          members: { orderBy: { joinedAt: 'asc' } },
        },
      },
    },
  })) as TeamMemberWithTeam | null

  if (!teamMember) {
    return
  }

  const team = teamMember.team

  await tx.teamMember.deleteMany({ where: { teamId: team.id, userId } })

  await handleCaptainSuccession(tx, team, userId)
}
