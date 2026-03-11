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
  members: { userId: string }[]
}

/** Team member with nested team (including members). Used by adminDeleteRegistration. */
type TeamMemberWithTeam = {
  userId: string
  team: TeamWithMembers
}

/** Forces deletion of a registration. SUPERADMIN can delete any; ADMIN can delete for assigned tournaments. */
export const adminDeleteRegistration = authenticatedAction({
  schema: deleteRegistrationSchema,
  role: [Role.ADMIN, Role.SUPERADMIN],
  handler: async (data, session): Promise<ActionState> => {
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

    // 2. If viewer is ADMIN (not SUPERADMIN), check tournament assignment
    if (session.user.role === Role.ADMIN) {
      const assignment = await prisma.adminAssignment.findUnique({
        where: {
          adminId_tournamentId: {
            adminId: session.user.id,
            tournamentId: registration.tournament.id,
          },
        },
      })
      if (!assignment) {
        return {
          success: false,
          message: "Vous n'avez pas accès à ce tournoi.",
        }
      }
    }

    // 3. SOLO format — just delete the registration
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

    // 4. TEAM format — find team membership
    const teamMember = (await prisma.teamMember.findFirst({
      where: {
        userId: registration.userId,
        team: { tournamentId: registration.tournament.id },
      },
      include: {
        team: {
          include: { members: { orderBy: { joinedAt: 'asc' } } },
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

        await tx.tournamentRegistration.updateMany({
          where: {
            tournamentId: registration.tournament.id,
            userId: newCaptain.userId,
          },
          data: { teamId: team.id },
        })

        await tx.team.update({
          where: { id: team.id },
          data: { captainId: newCaptain.userId, isFull: false },
        })
      } else if (otherMembers.length === 0) {
        // d. Last member — dissolve the team
        await tx.team.delete({ where: { id: team.id } })
      } else {
        // e. Non-captain leaving — mark team as not full
        await tx.team.update({
          where: { id: team.id },
          data: { isFull: false },
        })
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
  role: [Role.ADMIN, Role.SUPERADMIN],
  handler: async (data, session): Promise<ActionState> => {
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

    // ADMIN assignment check
    if (session.user.role === Role.ADMIN) {
      const assignment = await prisma.adminAssignment.findUnique({
        where: {
          adminId_tournamentId: {
            adminId: session.user.id,
            tournamentId: registration.tournament.id,
          },
        },
      })
      if (!assignment) {
        return {
          success: false,
          message: "Vous n'avez pas accès à ce tournoi.",
        }
      }
    }

    await prisma.tournamentRegistration.update({
      where: { id: registration.id },
      data: { fieldValues: data.fieldValues },
    })

    revalidateTag(CACHE_TAGS.REGISTRATIONS, 'minutes')

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
  isFull: boolean
}

/** Moves a player from their current team to a different team in the same tournament. */
export const adminChangeTeam = authenticatedAction({
  schema: changeTeamSchema,
  role: [Role.ADMIN, Role.SUPERADMIN],
  handler: async (data, session): Promise<ActionState> => {
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

    // 2. ADMIN assignment check
    if (session.user.role === Role.ADMIN) {
      const assignment = await prisma.adminAssignment.findUnique({
        where: {
          adminId_tournamentId: {
            adminId: session.user.id,
            tournamentId: registration.tournament.id,
          },
        },
      })
      if (!assignment) {
        return {
          success: false,
          message: "Vous n'avez pas accès à ce tournoi.",
        }
      }
    }

    // 3. Verify target team exists and belongs to the same tournament
    const targetTeam = (await prisma.team.findUnique({
      where: { id: data.targetTeamId },
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

    if (targetTeam.isFull) {
      return { success: false, message: "L'equipe cible est déjà complète." }
    }

    // 4. Find current team membership
    const currentMember = (await prisma.teamMember.findFirst({
      where: {
        userId: registration.userId,
        team: { tournamentId: registration.tournament.id },
      },
      include: {
        team: {
          include: { members: { orderBy: { joinedAt: 'asc' } } },
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

    // 5. Execute in a transaction
    await prisma.$transaction(async tx => {
      // a. Remove from old team
      await tx.teamMember.deleteMany({
        where: { teamId: oldTeam.id, userId: registration.userId },
      })

      // b. Handle captain succession on old team
      if (wasCaptain && otherMembers.length > 0) {
        const newCaptain = otherMembers[0]

        // Clear the teamId FK from old captain's registration (since they're leaving)
        await tx.tournamentRegistration.update({
          where: { id: registration.id },
          data: { teamId: null },
        })

        // Move teamId FK to new captain's registration
        await tx.tournamentRegistration.updateMany({
          where: {
            tournamentId: registration.tournament.id,
            userId: newCaptain.userId,
          },
          data: { teamId: oldTeam.id },
        })

        await tx.team.update({
          where: { id: oldTeam.id },
          data: { captainId: newCaptain.userId, isFull: false },
        })
      } else if (otherMembers.length === 0) {
        // Clear the teamId FK before dissolving the team (cascade would handle it, but be explicit)
        await tx.tournamentRegistration.update({
          where: { id: registration.id },
          data: { teamId: null },
        })

        await tx.team.delete({ where: { id: oldTeam.id } })
      } else {
        // Non-captain leaving old team
        await tx.team.update({
          where: { id: oldTeam.id },
          data: { isFull: false },
        })
      }

      // c. Add to new team
      await tx.teamMember.create({
        data: { teamId: data.targetTeamId, userId: registration.userId },
      })
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

/** Promotes a team member to captain (swaps the captainId and moves the teamId FK). */
export const adminPromoteCaptain = authenticatedAction({
  schema: promoteCaptainSchema,
  role: [Role.ADMIN, Role.SUPERADMIN],
  handler: async (data, session): Promise<ActionState> => {
    // 1. Fetch the team
    const team = (await prisma.team.findUnique({
      where: { id: data.teamId },
      include: { members: { select: { userId: true } } },
    })) as PromoteTeam | null

    if (!team) {
      return { success: false, message: 'Equipe introuvable.' }
    }

    // 2. ADMIN assignment check
    if (session.user.role === Role.ADMIN) {
      const assignment = await prisma.adminAssignment.findUnique({
        where: {
          adminId_tournamentId: {
            adminId: session.user.id,
            tournamentId: team.tournamentId,
          },
        },
      })
      if (!assignment) {
        return {
          success: false,
          message: "Vous n'avez pas accès à ce tournoi.",
        }
      }
    }

    // 3. Verify the user is a member of this team
    const isMember = team.members.some(m => m.userId === data.userId)
    if (!isMember) {
      return {
        success: false,
        message: "L'utilisateur n'est pas membre de cette equipe.",
      }
    }

    // 4. Verify user is not already captain
    if (team.captainId === data.userId) {
      return { success: false, message: "L'utilisateur est déjà capitaine." }
    }

    const oldCaptainId = team.captainId

    // 5. Swap in a transaction
    await prisma.$transaction(async tx => {
      // a. Remove teamId FK from old captain's registration
      await tx.tournamentRegistration.updateMany({
        where: { tournamentId: team.tournamentId, userId: oldCaptainId },
        data: { teamId: null },
      })

      // b. Set teamId FK on new captain's registration
      await tx.tournamentRegistration.updateMany({
        where: { tournamentId: team.tournamentId, userId: data.userId },
        data: { teamId: team.id },
      })

      // c. Update team captainId
      await tx.team.update({
        where: { id: team.id },
        data: { captainId: data.userId },
      })
    })

    revalidateTag(CACHE_TAGS.TOURNAMENTS, 'hours')
    revalidateTag(CACHE_TAGS.REGISTRATIONS, 'minutes')

    return {
      success: true,
      message: 'Le capitaine a été mis à jour.',
    }
  },
})
