/**
 * File: lib/utils/team.ts
 * Description: Shared team management utilities used by server actions and webhook handlers.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import 'server-only'
import type prisma from '@/lib/core/prisma'

/** Team with ordered members list. Used by removeUserFromTeam. */
type TeamWithMembers = {
  id: string
  captainId: string
  tournament: { teamSize: number }
  members: { userId: string }[]
}

/** Team member with nested team (including members). */
type TeamMemberWithTeam = {
  team: TeamWithMembers
}

/** Recomputes the `isFull` flag for a team after a membership mutation. */
export const syncTeamFullState = async (
  tx: Pick<typeof prisma, 'team' | 'teamMember'>,
  teamId: string,
  teamSize: number,
) => {
  const memberCount = await tx.teamMember.count({ where: { teamId } })

  await tx.team.update({
    where: { id: teamId },
    data: { isFull: memberCount >= teamSize },
  })
}

/** Removes a user from their team while keeping the registration row intact. */
export const removeUserFromTeam = async (
  tx: Pick<typeof prisma, 'team' | 'teamMember'>,
  userId: string,
  tournamentId: string,
) => {
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
  const otherMembers = team.members.filter(member => member.userId !== userId)
  const isCaptain = team.captainId === userId

  await tx.teamMember.deleteMany({ where: { teamId: team.id, userId } })

  if (otherMembers.length === 0) {
    await tx.team.delete({ where: { id: team.id } })
    return
  }

  if (isCaptain) {
    await tx.team.update({
      where: { id: team.id },
      data: { captainId: otherMembers[0].userId },
    })
  }

  await syncTeamFullState(tx, team.id, team.tournament.teamSize)
}
