/**
 * File: lib/actions/registrations-team.ts
 * Description: Server actions for admin team management (change team, promote captain, rename, delete logo).
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

'use server'

import { del } from '@vercel/blob'
import { updateTag } from 'next/cache'
import { authenticatedAction } from '@/lib/actions/safe-action'
import { runSerializableTransaction } from '@/lib/actions/serializable-transaction'
import { CACHE_TAGS } from '@/lib/config/constants'
import { logger } from '@/lib/core/logger'
import prisma from '@/lib/core/prisma'
import type { ActionState } from '@/lib/types/actions'
import type { TeamMemberWithTeam } from '@/lib/types/team'
import { handleCaptainSuccession, syncTeamFullState } from '@/lib/utils/team'
import {
  adminDeleteTeamLogoSchema,
  adminUpdateTeamNameSchema,
  changeTeamSchema,
  promoteCaptainSchema,
} from '@/lib/validations/registrations'
import {
  RegistrationStatus,
  Role,
  TournamentFormat,
} from '@/prisma/generated/prisma/enums'

// ---------------------------------------------------------------------------
// adminChangeTeam
// ---------------------------------------------------------------------------

/** Registration with tournament + user info. Used by adminChangeTeam. */
type ChangeTeamRegistration = {
  id: string
  userId: string
  status: RegistrationStatus
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

    if (
      registration.status !== RegistrationStatus.PENDING &&
      registration.status !== RegistrationStatus.CONFIRMED
    ) {
      return {
        success: false,
        message: "Cette inscription n'est plus active.",
      }
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
      return { success: false, message: 'Équipe cible introuvable.' }
    }

    if (targetTeam.tournamentId !== registration.tournament.id) {
      return {
        success: false,
        message: "L'équipe cible n'appartient pas au même tournoi.",
      }
    }

    if (targetTeam._count.members >= targetTeam.tournament.teamSize) {
      return { success: false, message: "L'équipe cible est déjà complète." }
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
        message: "Le joueur n'appartient à aucune équipe.",
      }
    }

    if (currentMember.team.id === data.targetTeamId) {
      return {
        success: false,
        message: 'Le joueur est déjà dans cette équipe.',
      }
    }

    const oldTeam = currentMember.team

    // 4. Execute in a serializable transaction so concurrent team moves cannot overfill the target.
    try {
      await runSerializableTransaction(async tx => {
        const freshTargetMemberCount = await tx.teamMember.count({
          where: { teamId: data.targetTeamId },
        })

        if (freshTargetMemberCount >= targetTeam.tournament.teamSize) {
          throw new Error('TARGET_TEAM_FULL')
        }

        // a. Remove from old team
        await tx.teamMember.deleteMany({
          where: { teamId: oldTeam.id, userId: registration.userId },
        })

        // b. Handle captain succession on old team
        await handleCaptainSuccession(tx, oldTeam, registration.userId)

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
    } catch (error) {
      if (error instanceof Error && error.message === 'TARGET_TEAM_FULL') {
        return { success: false, message: "L'équipe cible est déjà complète." }
      }

      throw error
    }

    updateTag(CACHE_TAGS.TOURNAMENTS)
    updateTag(CACHE_TAGS.DASHBOARD_REGISTRATIONS)
    updateTag(CACHE_TAGS.DASHBOARD_STATS)

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
      return { success: false, message: 'Équipe introuvable.' }
    }

    // 2. Verify the user is a member of this team
    const isMember = team.members.some(m => m.userId === data.userId)
    if (!isMember) {
      return {
        success: false,
        message: "L'utilisateur n'est pas membre de cette équipe.",
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

    updateTag(CACHE_TAGS.TOURNAMENTS)
    updateTag(CACHE_TAGS.DASHBOARD_REGISTRATIONS)
    updateTag(CACHE_TAGS.DASHBOARD_STATS)

    return {
      success: true,
      message: 'Le capitaine a été mis à jour.',
    }
  },
})

// ---------------------------------------------------------------------------
// Admin — update team name
// ---------------------------------------------------------------------------

/** Allows an admin to rename any team. */
export const adminUpdateTeamName = authenticatedAction({
  schema: adminUpdateTeamNameSchema,
  role: Role.ADMIN,
  handler: async (data): Promise<ActionState> => {
    const team = await prisma.team.findUnique({
      where: { id: data.teamId },
      select: { id: true, tournamentId: true },
    })

    if (!team) {
      return { success: false, message: 'Équipe introuvable.' }
    }

    // Check for duplicate team name within the same tournament
    const duplicate = await prisma.team.findFirst({
      where: {
        tournamentId: team.tournamentId,
        name: data.name,
        id: { not: team.id },
      },
      select: { id: true },
    })

    if (duplicate) {
      return {
        success: false,
        message: "Ce nom d'équipe est déjà pris dans ce tournoi.",
      }
    }

    await prisma.team.update({
      where: { id: team.id },
      data: { name: data.name },
    })

    updateTag(CACHE_TAGS.TOURNAMENTS)
    updateTag(CACHE_TAGS.DASHBOARD_REGISTRATIONS)

    return { success: true, message: "Le nom de l'équipe a été mis à jour." }
  },
})

// ---------------------------------------------------------------------------
// Admin — delete team logo
// ---------------------------------------------------------------------------

/** Allows an admin to delete a team's logo. */
export const adminDeleteTeamLogo = authenticatedAction({
  schema: adminDeleteTeamLogoSchema,
  role: Role.ADMIN,
  handler: async (data): Promise<ActionState> => {
    const team = await prisma.team.findUnique({
      where: { id: data.teamId },
      select: { id: true, logoUrl: true },
    })

    if (!team) {
      return { success: false, message: 'Équipe introuvable.' }
    }

    if (!team.logoUrl) {
      return { success: false, message: 'Aucun logo à supprimer.' }
    }

    try {
      await del(team.logoUrl)
    } catch (error) {
      logger.error({ error }, 'Error deleting team logo blob')
    }

    await prisma.team.update({
      where: { id: team.id },
      data: { logoUrl: null },
    })

    updateTag(CACHE_TAGS.TOURNAMENTS)

    return { success: true, message: "Le logo de l'équipe a été supprimé." }
  },
})
