/**
 * File: lib/actions/registrations.ts
 * Description: Server actions for admin registration management.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

'use server'

import { revalidateTag } from 'next/cache'
import { authenticatedAction } from '@/lib/actions/safe-action'
import { CACHE_TAGS } from '@/lib/config/constants'
import prisma from '@/lib/core/prisma'
import type { ActionState } from '@/lib/types/actions'
import {
  changeTeamSchema,
  deleteRegistrationSchema,
  promoteCaptainSchema,
  updateRegistrationFieldsSchema,
} from '@/lib/validations/registrations'
import { Role, TournamentFormat } from '@/prisma/generated/prisma/enums'

/** Registration with tournament info. Used by adminDeleteRegistration. */
type RegistrationWithDetails = {
  id: string
  userId: string
  tournament: { id: string; format: TournamentFormat }
  user: { name: string }
}

/** Team with ordered members. Used by adminDeleteRegistration. */
type TeamWithMembers = {
  id: string
  captainId: string
  tournament: { teamSize: number }
  members: { userId: string }[]
}

/** Team member with nested team (including members). Used by adminDeleteRegistration. */
type TeamMemberWithTeam = {
  userId: string
  team: TeamWithMembers
}

/** Forces deletion of a registration. */
export const adminDeleteRegistration = authenticatedAction({
  schema: deleteRegistrationSchema,
  role: Role.ADMIN,
  handler: async (data): Promise<ActionState> => {
    // 1. Fetch registration with tournament + user info
    const registration = (await prisma.tournamentRegistration.findUnique({
      where: { id: data.registrationId },
      include: {
        tournament: { select: { id: true, format: true } },
        user: { select: { name: true } },
      },
    })) as RegistrationWithDetails | null

    if (!registration) {
      return { success: false, message: 'Inscription introuvable.' }
    }

    // 2. SOLO format — just delete the registration
    if (registration.tournament.format === TournamentFormat.SOLO) {
      await prisma.tournamentRegistration.delete({
        where: { id: registration.id },
      })

      revalidateTag(CACHE_TAGS.TOURNAMENTS, 'hours')
      revalidateTag(CACHE_TAGS.DASHBOARD_REGISTRATIONS, 'minutes')
      revalidateTag(CACHE_TAGS.REGISTRATIONS, 'minutes')
      revalidateTag(CACHE_TAGS.DASHBOARD_STATS, 'minutes')

      return {
        success: true,
        message: `L'inscription de ${registration.user.name} a été supprimée.`,
      }
    }

    // 3. TEAM format — find team membership
    const teamMember = (await prisma.teamMember.findFirst({
      where: {
        userId: registration.userId,
        team: { tournamentId: registration.tournament.id },
      },
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
      // Edge case: registration exists but no team membership — clean up
      await prisma.tournamentRegistration.delete({
        where: { id: registration.id },
      })

      revalidateTag(CACHE_TAGS.TOURNAMENTS, 'hours')
      revalidateTag(CACHE_TAGS.DASHBOARD_REGISTRATIONS, 'minutes')
      revalidateTag(CACHE_TAGS.REGISTRATIONS, 'minutes')
      revalidateTag(CACHE_TAGS.DASHBOARD_STATS, 'minutes')

      return {
        success: true,
        message: `L'inscription de ${registration.user.name} a été supprimée.`,
      }
    }

    const team = teamMember.team
    const isCaptain = team.captainId === registration.userId
    const otherMembers = team.members.filter(
      m => m.userId !== registration.userId,
    )

    await prisma.$transaction(async tx => {
      // a. Remove team member record
      await tx.teamMember.deleteMany({
        where: { teamId: team.id, userId: registration.userId },
      })

      // b. Remove tournament registration
      await tx.tournamentRegistration.delete({ where: { id: registration.id } })

      if (isCaptain && otherMembers.length > 0) {
        // c. Promote next member to captain
        const newCaptain = otherMembers[0]

        await tx.team.update({
          where: { id: team.id },
          data: { captainId: newCaptain.userId },
        })
        await syncTeamFullState(tx, team.id, team.tournament.teamSize)
      } else if (otherMembers.length === 0) {
        // d. Last member — dissolve the team
        await tx.team.delete({ where: { id: team.id } })
      } else {
        // e. Non-captain leaving — keep team state in sync
        await syncTeamFullState(tx, team.id, team.tournament.teamSize)
      }
    })

    revalidateTag(CACHE_TAGS.TOURNAMENTS, 'hours')
    revalidateTag(CACHE_TAGS.DASHBOARD_REGISTRATIONS, 'minutes')
    revalidateTag(CACHE_TAGS.REGISTRATIONS, 'minutes')
    revalidateTag(CACHE_TAGS.DASHBOARD_STATS, 'minutes')

    return {
      success: true,
      message: `L'inscription de ${registration.user.name} a été supprimée.`,
    }
  },
})

// ---------------------------------------------------------------------------
// adminUpdateRegistrationFields
// ---------------------------------------------------------------------------

/** Updates the custom field values (fieldValues JSON) on a registration. */
export const adminUpdateRegistrationFields = authenticatedAction({
  schema: updateRegistrationFieldsSchema,
  role: Role.ADMIN,
  handler: async (data): Promise<ActionState> => {
    const registration = (await prisma.tournamentRegistration.findUnique({
      where: { id: data.registrationId },
      include: {
        tournament: { select: { id: true } },
        user: { select: { name: true } },
      },
    })) as {
      id: string
      tournament: { id: string }
      user: { name: string }
    } | null

    if (!registration) {
      return { success: false, message: 'Inscription introuvable.' }
    }

    await prisma.tournamentRegistration.update({
      where: { id: registration.id },
      data: { fieldValues: data.fieldValues },
    })

    revalidateTag(CACHE_TAGS.REGISTRATIONS, 'minutes')
    revalidateTag(CACHE_TAGS.TOURNAMENTS, 'hours')

    return {
      success: true,
      message: `Les champs de ${registration.user.name} ont été mis à jour.`,
    }
  },
})

// ---------------------------------------------------------------------------
// adminChangeTeam
// ---------------------------------------------------------------------------

/** Registration with tournament + user info. Used by adminChangeTeam. */
type ChangeTeamRegistration = {
  id: string
  userId: string
  tournament: { id: string; format: TournamentFormat }
  user: { name: string }
}

/** Target team with members count. Used by adminChangeTeam. */
type TargetTeam = {
  id: string
  name: string
  tournamentId: string
  tournament: { teamSize: number }
  _count: { members: number }
}

/** Recomputes the `isFull` flag for a team after an admin mutation. */
const syncTeamFullState = async (
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

/** Moves a player from their current team to a different team in the same tournament. */
export const adminChangeTeam = authenticatedAction({
  schema: changeTeamSchema,
  role: Role.ADMIN,
  handler: async (data): Promise<ActionState> => {
    // 1. Fetch registration
    const registration = (await prisma.tournamentRegistration.findUnique({
      where: { id: data.registrationId },
      include: {
        tournament: { select: { id: true, format: true } },
        user: { select: { name: true } },
      },
    })) as ChangeTeamRegistration | null

    if (!registration) {
      return { success: false, message: 'Inscription introuvable.' }
    }

    if (registration.tournament.format !== TournamentFormat.TEAM) {
      return {
        success: false,
        message: "Ce tournoi n'est pas au format équipe.",
      }
    }

    // 2. Verify target team exists and belongs to the same tournament
    const targetTeam = (await prisma.team.findUnique({
      where: { id: data.targetTeamId },
      include: {
        tournament: { select: { teamSize: true } },
        _count: { select: { members: true } },
      },
    })) as TargetTeam | null

    if (!targetTeam) {
      return { success: false, message: 'Equipe cible introuvable.' }
    }

    if (targetTeam.tournamentId !== registration.tournament.id) {
      return {
        success: false,
        message: "L'equipe cible n'appartient pas au même tournoi.",
      }
    }

    if (targetTeam._count.members >= targetTeam.tournament.teamSize) {
      return { success: false, message: "L'equipe cible est déjà complète." }
    }

    // 3. Find current team membership
    const currentMember = (await prisma.teamMember.findFirst({
      where: {
        userId: registration.userId,
        team: { tournamentId: registration.tournament.id },
      },
      include: {
        team: {
          include: {
            tournament: { select: { teamSize: true } },
            members: { orderBy: { joinedAt: 'asc' } },
          },
        },
      },
    })) as TeamMemberWithTeam | null

    if (!currentMember) {
      return {
        success: false,
        message: "Le joueur n'appartient à aucune equipe.",
      }
    }

    if (currentMember.team.id === data.targetTeamId) {
      return {
        success: false,
        message: 'Le joueur est déjà dans cette equipe.',
      }
    }

    const oldTeam = currentMember.team
    const wasCaptain = oldTeam.captainId === registration.userId
    const otherMembers = oldTeam.members.filter(
      m => m.userId !== registration.userId,
    )

    // 4. Execute in a transaction
    await prisma.$transaction(async tx => {
      // a. Remove from old team
      await tx.teamMember.deleteMany({
        where: { teamId: oldTeam.id, userId: registration.userId },
      })

      // b. Handle captain succession on old team
      if (wasCaptain && otherMembers.length > 0) {
        const newCaptain = otherMembers[0]

        await tx.team.update({
          where: { id: oldTeam.id },
          data: { captainId: newCaptain.userId },
        })
        await syncTeamFullState(tx, oldTeam.id, oldTeam.tournament.teamSize)
      } else if (otherMembers.length === 0) {
        await tx.team.delete({ where: { id: oldTeam.id } })
      } else {
        // Non-captain leaving old team
        await syncTeamFullState(tx, oldTeam.id, oldTeam.tournament.teamSize)
      }

      // c. Add to new team
      await tx.teamMember.create({
        data: { teamId: data.targetTeamId, userId: registration.userId },
      })

      await tx.tournamentRegistration.update({
        where: { id: registration.id },
        data: { teamId: data.targetTeamId },
      })

      await syncTeamFullState(
        tx,
        data.targetTeamId,
        targetTeam.tournament.teamSize,
      )
    })

    revalidateTag(CACHE_TAGS.TOURNAMENTS, 'hours')
    revalidateTag(CACHE_TAGS.REGISTRATIONS, 'minutes')

    return {
      success: true,
      message: `${registration.user.name} a été déplacé vers ${targetTeam.name}.`,
    }
  },
})

// ---------------------------------------------------------------------------
// adminPromoteCaptain
// ---------------------------------------------------------------------------

/** Team with captain + members info. Used by adminPromoteCaptain. */
type PromoteTeam = {
  id: string
  captainId: string
  tournamentId: string
  members: { userId: string }[]
}

/** Promotes a team member to captain. */
export const adminPromoteCaptain = authenticatedAction({
  schema: promoteCaptainSchema,
  role: Role.ADMIN,
  handler: async (data): Promise<ActionState> => {
    // 1. Fetch the team
    const team = (await prisma.team.findUnique({
      where: { id: data.teamId },
      include: { members: { select: { userId: true } } },
    })) as PromoteTeam | null

    if (!team) {
      return { success: false, message: 'Equipe introuvable.' }
    }

    // 2. Verify the user is a member of this team
    const isMember = team.members.some(m => m.userId === data.userId)
    if (!isMember) {
      return {
        success: false,
        message: "L'utilisateur n'est pas membre de cette equipe.",
      }
    }

    // 3. Verify user is not already captain
    if (team.captainId === data.userId) {
      return { success: false, message: "L'utilisateur est déjà capitaine." }
    }

    await prisma.team.update({
      where: { id: team.id },
      data: { captainId: data.userId },
    })

    revalidateTag(CACHE_TAGS.TOURNAMENTS, 'hours')
    revalidateTag(CACHE_TAGS.REGISTRATIONS, 'minutes')

    return {
      success: true,
      message: 'Le capitaine a été mis à jour.',
    }
  },
})
