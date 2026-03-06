/**
 * File: lib/actions/tournaments.ts
 * Description: Server actions for tournament CRUD, registration management, and user registration.
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
import { isBanned } from '@/lib/utils/auth.helpers'
import { toNullable } from '@/lib/utils/formatting'
import {
  createTeamSchema,
  deleteTournamentSchema,
  dissolveTeamSchema,
  joinTeamSchema,
  kickPlayerSchema,
  registerForTournamentSchema,
  tournamentSchema,
  unregisterFromTournamentSchema,
  updateRegistrationFieldsSchema,
  updateRegistrationStatusSchema,
  updateTournamentSchema,
  updateTournamentStatusSchema,
} from '@/lib/validations/tournaments'
import type {
  FieldType,
  RegistrationStatus,
  TournamentFormat,
  TournamentStatus,
} from '@/prisma/generated/prisma/enums'
import { Role } from '@/prisma/generated/prisma/enums'

// ---------------------------------------------------------------------------
// Local query result types (narrow shapes matching Prisma includes)
// ---------------------------------------------------------------------------

/** Tournament with its dynamic fields and a registration count. Used by updateTournament. */
type TournamentWithFieldsAndCount = {
  id: string
  format: TournamentFormat
  status: TournamentStatus
  fields: { label: string; type: FieldType; required: boolean; order: number }[]
  _count: { registrations: number }
}

/** Tournament with its dynamic fields and registration-relevant scalars. Used by registration actions. */
type TournamentWithFields = {
  id: string
  status: TournamentStatus
  format: TournamentFormat
  registrationOpen: Date
  registrationClose: Date
  maxTeams: number | null
  teamSize: number
  autoApprove: boolean
  fields: { label: string; type: FieldType; required: boolean; order: number }[]
}

/** Registration with nested tournament (including fields). Used by updateRegistrationFields. */
type RegistrationWithTournament = {
  id: string
  userId: string
  tournamentId: string
  status: RegistrationStatus
  tournament: TournamentWithFields
}

/** Registration with minimal tournament info. Used by unregisterFromTournament. */
type RegistrationWithTournamentInfo = {
  id: string
  tournament: { status: TournamentStatus; format: TournamentFormat }
}

/** Team with a member count. Used by joinTeamAndRegister. */
type TeamWithMemberCount = {
  id: string
  tournamentId: string
  isFull: boolean
  _count: { members: number }
}

/** Team with ordered members list. Used by kickPlayer and unregisterFromTournament. */
type TeamWithMembers = {
  id: string
  tournamentId: string
  captainId: string
  members: { userId: string }[]
}

/** Team member with nested team (including members). Used by unregisterFromTournament. */
type TeamMemberWithTeam = {
  team: TeamWithMembers
}

/**
 * Checks whether an ADMIN user is assigned to a given tournament.
 * SUPERADMINs always pass this check.
 */
const checkAdminAssignment = async (
  userId: string,
  userRole: Role,
  tournamentId: string,
): Promise<boolean> => {
  if (userRole === Role.SUPERADMIN) return true

  const assignment = await prisma.adminAssignment.findUnique({
    where: {
      adminId_tournamentId: {
        adminId: userId,
        tournamentId,
      },
    },
  })
  return !!assignment
}

/**
 * Checks whether a user is currently banned.
 * Returns an ActionState error if banned, or null if not banned.
 */
const checkBanStatus = async (userId: string): Promise<ActionState | null> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { bannedUntil: true },
  })
  if (user && isBanned(user.bannedUntil)) {
    return { success: false, message: 'Votre compte est banni.' }
  }
  return null
}

/** Validates dynamic field values against tournament field definitions. */
const validateFieldValues = (
  fields: { label: string; type: string; required: boolean }[],
  fieldValues: Record<string, string | number>,
): { valid: true } | { valid: false; message: string } => {
  for (const field of fields) {
    const value = fieldValues[field.label]
    if (field.required && (value === undefined || value === '')) {
      return {
        valid: false,
        message: `Le champ « ${field.label} » est requis.`,
      }
    }
    if (field.type === 'NUMBER' && value !== undefined && value !== '') {
      if (typeof value !== 'number' || Number.isNaN(value)) {
        return {
          valid: false,
          message: `Le champ « ${field.label} » doit être un nombre.`,
        }
      }
    }
  }
  return { valid: true }
}

/** Creates a new tournament with its dynamic fields. */
export const createTournament = authenticatedAction({
  schema: tournamentSchema,
  role: [Role.ADMIN, Role.SUPERADMIN],
  handler: async (data): Promise<ActionState> => {
    await prisma.tournament.create({
      data: {
        title: data.title,
        slug: data.slug,
        description: data.description,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        registrationOpen: new Date(data.registrationOpen),
        registrationClose: new Date(data.registrationClose),
        maxTeams: data.maxTeams,
        format: data.format,
        teamSize: data.teamSize,
        game: toNullable(data.game),
        imageUrl: toNullable(data.imageUrl),
        rules: toNullable(data.rules),
        prize: toNullable(data.prize),
        toornamentId: toNullable(data.toornamentId),
        streamUrl: toNullable(data.streamUrl),
        autoApprove: data.autoApprove,
        fields: {
          create: data.fields.map(field => ({
            label: field.label,
            type: field.type,
            required: field.required,
            order: field.order,
          })),
        },
      },
    })

    revalidateTag(CACHE_TAGS.TOURNAMENTS, 'hours')
    revalidateTag(CACHE_TAGS.TOURNAMENT_OPTIONS, 'minutes')
    revalidateTag(CACHE_TAGS.DASHBOARD_STATS, 'minutes')

    return { success: true, message: 'Le tournoi a été créé.' }
  },
})

/** Updates an existing tournament and syncs its dynamic fields. */
export const updateTournament = authenticatedAction({
  schema: updateTournamentSchema,
  role: [Role.ADMIN, Role.SUPERADMIN],
  handler: async (data, session): Promise<ActionState> => {
    const hasAccess = await checkAdminAssignment(
      session.user.id,
      session.user.role,
      data.id,
    )
    if (!hasAccess) {
      return {
        success: false,
        message: "Vous n'avez pas accès à ce tournoi.",
      }
    }

    // Fetch existing tournament to enforce immutability rules
    const existing = (await prisma.tournament.findUnique({
      where: { id: data.id },
      include: {
        fields: { orderBy: { order: 'asc' } },
        _count: { select: { registrations: true } },
      },
    })) as TournamentWithFieldsAndCount | null

    if (!existing) {
      return { success: false, message: 'Tournoi introuvable.' }
    }

    // Format is immutable after creation
    if (data.format !== existing.format) {
      return {
        success: false,
        message:
          'Le format du tournoi ne peut pas être modifié après la création.',
      }
    }

    // Dynamic fields are locked when tournament is PUBLISHED with registrations
    if (existing.status === 'PUBLISHED' && existing._count.registrations > 0) {
      const existingFields = existing.fields.map(f => ({
        label: f.label,
        type: f.type,
        required: f.required,
        order: f.order,
      }))
      const submittedFields = data.fields.map(f => ({
        label: f.label,
        type: f.type,
        required: f.required,
        order: f.order,
      }))
      const fieldsChanged =
        JSON.stringify(existingFields) !== JSON.stringify(submittedFields)
      if (fieldsChanged) {
        return {
          success: false,
          message:
            'Les champs personnalisés ne peuvent pas être modifiés lorsque le tournoi est publié et a des inscriptions.',
        }
      }
    }

    await prisma.$transaction([
      // Delete existing fields and re-create them
      prisma.tournamentField.deleteMany({
        where: { tournamentId: data.id },
      }),
      prisma.tournament.update({
        where: { id: data.id },
        data: {
          title: data.title,
          slug: data.slug,
          description: data.description,
          startDate: new Date(data.startDate),
          endDate: new Date(data.endDate),
          registrationOpen: new Date(data.registrationOpen),
          registrationClose: new Date(data.registrationClose),
          maxTeams: data.maxTeams,
          format: data.format,
          teamSize: data.teamSize,
          game: toNullable(data.game),
          imageUrl: toNullable(data.imageUrl),
          rules: toNullable(data.rules),
          prize: toNullable(data.prize),
          toornamentId: toNullable(data.toornamentId),
          streamUrl: toNullable(data.streamUrl),
          autoApprove: data.autoApprove,
          fields: {
            create: data.fields.map(field => ({
              label: field.label,
              type: field.type,
              required: field.required,
              order: field.order,
            })),
          },
        },
      }),
    ])

    revalidateTag(CACHE_TAGS.TOURNAMENTS, 'hours')
    revalidateTag(CACHE_TAGS.TOURNAMENT_OPTIONS, 'minutes')
    revalidateTag(CACHE_TAGS.DASHBOARD_UPCOMING, 'minutes')

    return { success: true, message: 'Le tournoi a été mis à jour.' }
  },
})

/** Deletes a tournament by ID. */
export const deleteTournament = authenticatedAction({
  schema: deleteTournamentSchema,
  role: [Role.ADMIN, Role.SUPERADMIN],
  handler: async (data, session): Promise<ActionState> => {
    const hasAccess = await checkAdminAssignment(
      session.user.id,
      session.user.role,
      data.id,
    )
    if (!hasAccess) {
      return {
        success: false,
        message: "Vous n'avez pas accès à ce tournoi.",
      }
    }

    await prisma.tournament.delete({
      where: { id: data.id },
    })

    revalidateTag(CACHE_TAGS.TOURNAMENTS, 'hours')
    revalidateTag(CACHE_TAGS.TOURNAMENT_OPTIONS, 'minutes')
    revalidateTag(CACHE_TAGS.DASHBOARD_STATS, 'minutes')
    revalidateTag(CACHE_TAGS.DASHBOARD_UPCOMING, 'minutes')
    revalidateTag(CACHE_TAGS.DASHBOARD_REGISTRATIONS, 'minutes')

    return { success: true, message: 'Le tournoi a été supprimé.' }
  },
})

/** Updates a tournament's status (DRAFT / PUBLISHED / ARCHIVED). */
export const updateTournamentStatus = authenticatedAction({
  schema: updateTournamentStatusSchema,
  role: [Role.ADMIN, Role.SUPERADMIN],
  handler: async (data, session): Promise<ActionState> => {
    const hasAccess = await checkAdminAssignment(
      session.user.id,
      session.user.role,
      data.id,
    )
    if (!hasAccess) {
      return {
        success: false,
        message: "Vous n'avez pas accès à ce tournoi.",
      }
    }

    await prisma.tournament.update({
      where: { id: data.id },
      data: { status: data.status },
    })

    revalidateTag(CACHE_TAGS.TOURNAMENTS, 'hours')
    revalidateTag(CACHE_TAGS.TOURNAMENT_OPTIONS, 'minutes')
    revalidateTag(CACHE_TAGS.DASHBOARD_STATS, 'minutes')
    revalidateTag(CACHE_TAGS.DASHBOARD_UPCOMING, 'minutes')

    return { success: true, message: 'Le statut du tournoi a été mis à jour.' }
  },
})

/** Updates a registration's status (approve / reject). */
export const updateRegistrationStatus = authenticatedAction({
  schema: updateRegistrationStatusSchema,
  role: [Role.ADMIN, Role.SUPERADMIN],
  handler: async (data, session): Promise<ActionState> => {
    const hasAccess = await checkAdminAssignment(
      session.user.id,
      session.user.role,
      data.tournamentId,
    )
    if (!hasAccess) {
      return {
        success: false,
        message: "Vous n'avez pas accès à ce tournoi.",
      }
    }

    await prisma.tournamentRegistration.update({
      where: { id: data.id },
      data: { status: data.status },
    })

    revalidateTag(CACHE_TAGS.TOURNAMENTS, 'hours')
    revalidateTag(CACHE_TAGS.DASHBOARD_REGISTRATIONS, 'minutes')
    revalidateTag(CACHE_TAGS.DASHBOARD_STATS, 'minutes')

    return {
      success: true,
      message: "Le statut de l'inscription a été mis à jour.",
    }
  },
})

// ---------------------------------------------------------------------------
// Public registration
// ---------------------------------------------------------------------------

/** Updates a user's own registration field values. Resets status to PENDING if it was APPROVED. */
export const updateRegistrationFields = authenticatedAction({
  schema: updateRegistrationFieldsSchema,
  handler: async (data, session): Promise<ActionState> => {
    // 1. Fetch existing registration and verify ownership
    const registration = (await prisma.tournamentRegistration.findUnique({
      where: { id: data.registrationId },
      include: {
        tournament: {
          include: { fields: { orderBy: { order: 'asc' } } },
        },
      },
    })) as RegistrationWithTournament | null

    if (!registration) {
      return { success: false, message: 'Inscription introuvable.' }
    }

    if (registration.userId !== session.user.id) {
      return {
        success: false,
        message: "Vous ne pouvez pas modifier l'inscription d'un autre joueur.",
      }
    }

    if (registration.tournamentId !== data.tournamentId) {
      return { success: false, message: 'ID de tournoi invalide.' }
    }

    // 2. Check tournament is still PUBLISHED
    if (registration.tournament.status !== 'PUBLISHED') {
      return {
        success: false,
        message: 'Ce tournoi est introuvable ou indisponible.',
      }
    }

    // 3. Validate dynamic field values
    const tournament: TournamentWithFields = registration.tournament
    const fieldValidation = validateFieldValues(
      tournament.fields,
      data.fieldValues,
    )
    if (!fieldValidation.valid) {
      return { success: false, message: fieldValidation.message }
    }

    // 4. Update field values; reset to PENDING if status was APPROVED
    const newStatus =
      registration.status === 'APPROVED' ? 'PENDING' : registration.status

    await prisma.tournamentRegistration.update({
      where: { id: data.registrationId },
      data: {
        fieldValues: data.fieldValues,
        status: newStatus,
      },
    })

    revalidateTag(CACHE_TAGS.TOURNAMENTS, 'hours')
    revalidateTag(CACHE_TAGS.DASHBOARD_REGISTRATIONS, 'minutes')
    revalidateTag(CACHE_TAGS.DASHBOARD_STATS, 'minutes')

    const statusMessage =
      registration.status === 'APPROVED'
        ? ' Votre inscription a été remise en attente de validation.'
        : ''

    return {
      success: true,
      message: `Votre inscription a été mise à jour.${statusMessage}`,
    }
  },
})

/** Registers the current user for a tournament (solo format). */
export const registerForTournament = authenticatedAction({
  schema: registerForTournamentSchema,
  handler: async (data, session): Promise<ActionState> => {
    // 1. Check ban status
    const banResult = await checkBanStatus(session.user.id)
    if (banResult) return banResult

    // 2. Fetch tournament with fields
    const tournament = (await prisma.tournament.findUnique({
      where: { id: data.tournamentId },
      include: { fields: { orderBy: { order: 'asc' } } },
    })) as TournamentWithFields | null

    if (!tournament || tournament.status !== 'PUBLISHED') {
      return {
        success: false,
        message: 'Ce tournoi est introuvable ou indisponible.',
      }
    }

    // 3. Reject TEAM format — use createTeamAndRegister or joinTeamAndRegister instead
    if (tournament.format === 'TEAM') {
      return {
        success: false,
        message:
          'Ce tournoi est en format équipe. Utilisez le formulaire équipe.',
      }
    }

    // 4. Check registration window
    const now = new Date()
    if (
      now < tournament.registrationOpen ||
      now > tournament.registrationClose
    ) {
      return {
        success: false,
        message: 'Les inscriptions ne sont pas ouvertes.',
      }
    }

    // 5. Check maxTeams limit (registrations count as "slots" for solo)
    if (tournament.maxTeams !== null) {
      const count = await prisma.tournamentRegistration.count({
        where: {
          tournamentId: data.tournamentId,
          status: { in: ['PENDING', 'APPROVED'] },
        },
      })
      if (count >= tournament.maxTeams) {
        return { success: false, message: 'Le tournoi est complet.' }
      }
    }

    // 6. Check user hasn't already registered
    const existing = await prisma.tournamentRegistration.findUnique({
      where: {
        tournamentId_userId: {
          tournamentId: data.tournamentId,
          userId: session.user.id,
        },
      },
    })
    if (existing) {
      return {
        success: false,
        message: 'Vous êtes déjà inscrit à ce tournoi.',
      }
    }

    // 7. Validate dynamic field values
    const validation = validateFieldValues(tournament.fields, data.fieldValues)
    if (!validation.valid) {
      return { success: false, message: validation.message }
    }

    // 8. Create the registration
    await prisma.tournamentRegistration.create({
      data: {
        tournamentId: data.tournamentId,
        userId: session.user.id,
        fieldValues: data.fieldValues,
        status: tournament.autoApprove ? 'APPROVED' : 'PENDING',
      },
    })

    revalidateTag(CACHE_TAGS.TOURNAMENTS, 'hours')
    revalidateTag(CACHE_TAGS.DASHBOARD_REGISTRATIONS, 'minutes')

    return { success: true, message: 'Votre inscription a été enregistrée.' }
  },
})

// ---------------------------------------------------------------------------
// Team registration (public)
// ---------------------------------------------------------------------------

/** Creates a team and registers the current user as captain. */
export const createTeamAndRegister = authenticatedAction({
  schema: createTeamSchema,
  handler: async (data, session): Promise<ActionState> => {
    // 1. Check ban status
    const banResult = await checkBanStatus(session.user.id)
    if (banResult) return banResult

    // 2. Fetch tournament with fields
    const tournament = (await prisma.tournament.findUnique({
      where: { id: data.tournamentId },
      include: { fields: { orderBy: { order: 'asc' } } },
    })) as TournamentWithFields | null

    if (!tournament || tournament.status !== 'PUBLISHED') {
      return {
        success: false,
        message: 'Ce tournoi est introuvable ou indisponible.',
      }
    }

    // 3. Reject SOLO format
    if (tournament.format !== 'TEAM') {
      return {
        success: false,
        message: 'Ce tournoi est en format solo. Utilisez le formulaire solo.',
      }
    }

    // 4. Check registration window
    const now = new Date()
    if (
      now < tournament.registrationOpen ||
      now > tournament.registrationClose
    ) {
      return {
        success: false,
        message: 'Les inscriptions ne sont pas ouvertes.',
      }
    }

    // 5. Check maxTeams limit (count teams, not registrations)
    if (tournament.maxTeams !== null) {
      const teamCount = await prisma.team.count({
        where: { tournamentId: data.tournamentId },
      })
      if (teamCount >= tournament.maxTeams) {
        return {
          success: false,
          message: "Le nombre maximum d'équipes est atteint.",
        }
      }
    }

    // 6. Check user hasn't already registered
    const existing = await prisma.tournamentRegistration.findUnique({
      where: {
        tournamentId_userId: {
          tournamentId: data.tournamentId,
          userId: session.user.id,
        },
      },
    })
    if (existing) {
      return {
        success: false,
        message: 'Vous êtes déjà inscrit à ce tournoi.',
      }
    }

    // 7. Validate dynamic field values
    const validation = validateFieldValues(tournament.fields, data.fieldValues)
    if (!validation.valid) {
      return { success: false, message: validation.message }
    }

    // 8. Create team + member + registration in a single transaction
    await prisma.$transaction(async tx => {
      const team = await tx.team.create({
        data: {
          name: data.teamName,
          captainId: session.user.id,
          tournamentId: data.tournamentId,
          isFull: tournament.teamSize <= 1,
        },
      })

      await tx.teamMember.create({
        data: {
          teamId: team.id,
          userId: session.user.id,
        },
      })

      await tx.tournamentRegistration.create({
        data: {
          tournamentId: data.tournamentId,
          userId: session.user.id,
          fieldValues: data.fieldValues,
          status: tournament.autoApprove ? 'APPROVED' : 'PENDING',
          teamId: team.id,
        },
      })
    })

    revalidateTag(CACHE_TAGS.TOURNAMENTS, 'hours')
    revalidateTag(CACHE_TAGS.DASHBOARD_REGISTRATIONS, 'minutes')
    revalidateTag(CACHE_TAGS.DASHBOARD_STATS, 'minutes')

    return {
      success: true,
      message: 'Votre équipe a été créée et votre inscription enregistrée.',
    }
  },
})

/** Joins an existing team and registers the current user. */
export const joinTeamAndRegister = authenticatedAction({
  schema: joinTeamSchema,
  handler: async (data, session): Promise<ActionState> => {
    // 1. Check ban status
    const banResult = await checkBanStatus(session.user.id)
    if (banResult) return banResult

    // 2. Fetch tournament with fields
    const tournament = (await prisma.tournament.findUnique({
      where: { id: data.tournamentId },
      include: { fields: { orderBy: { order: 'asc' } } },
    })) as TournamentWithFields | null

    if (!tournament || tournament.status !== 'PUBLISHED') {
      return {
        success: false,
        message: 'Ce tournoi est introuvable ou indisponible.',
      }
    }

    // 3. Reject SOLO format
    if (tournament.format !== 'TEAM') {
      return {
        success: false,
        message: 'Ce tournoi est en format solo. Utilisez le formulaire solo.',
      }
    }

    // 4. Check registration window
    const now = new Date()
    if (
      now < tournament.registrationOpen ||
      now > tournament.registrationClose
    ) {
      return {
        success: false,
        message: 'Les inscriptions ne sont pas ouvertes.',
      }
    }

    // 5. Check user hasn't already registered
    const existing = await prisma.tournamentRegistration.findUnique({
      where: {
        tournamentId_userId: {
          tournamentId: data.tournamentId,
          userId: session.user.id,
        },
      },
    })
    if (existing) {
      return {
        success: false,
        message: 'Vous êtes déjà inscrit à ce tournoi.',
      }
    }

    // 6. Fetch team and verify it belongs to the tournament and is not full
    const team = (await prisma.team.findUnique({
      where: { id: data.teamId },
      include: { _count: { select: { members: true } } },
    })) as TeamWithMemberCount | null

    if (!team || team.tournamentId !== data.tournamentId) {
      return { success: false, message: 'Équipe introuvable.' }
    }

    if (team.isFull) {
      return { success: false, message: 'Cette équipe est complète.' }
    }

    // 7. Validate dynamic field values
    const validation = validateFieldValues(tournament.fields, data.fieldValues)
    if (!validation.valid) {
      return { success: false, message: validation.message }
    }

    // 8. Create member + registration, conditionally mark team as full
    await prisma.$transaction(async tx => {
      await tx.teamMember.create({
        data: {
          teamId: data.teamId,
          userId: session.user.id,
        },
      })

      // Mark team as full if member count reaches teamSize
      const newMemberCount = team._count.members + 1
      if (newMemberCount >= tournament.teamSize) {
        await tx.team.update({
          where: { id: data.teamId },
          data: { isFull: true },
        })
      }

      await tx.tournamentRegistration.create({
        data: {
          tournamentId: data.tournamentId,
          userId: session.user.id,
          fieldValues: data.fieldValues,
          status: tournament.autoApprove ? 'APPROVED' : 'PENDING',
        },
      })
    })

    revalidateTag(CACHE_TAGS.TOURNAMENTS, 'hours')
    revalidateTag(CACHE_TAGS.DASHBOARD_REGISTRATIONS, 'minutes')
    revalidateTag(CACHE_TAGS.DASHBOARD_STATS, 'minutes')

    return {
      success: true,
      message:
        "Vous avez rejoint l'équipe et votre inscription a été enregistrée.",
    }
  },
})

// ---------------------------------------------------------------------------
// Player unregistration
// ---------------------------------------------------------------------------

/** Cancels a player's own registration. For team tournaments, handles captain succession or team dissolution. */
export const unregisterFromTournament = authenticatedAction({
  schema: unregisterFromTournamentSchema,
  handler: async (data, session): Promise<ActionState> => {
    const userId = session.user.id

    // 1. Check ban status
    const banResult = await checkBanStatus(userId)
    if (banResult) return banResult

    // 2. Fetch the registration with tournament info
    const registration = (await prisma.tournamentRegistration.findUnique({
      where: {
        tournamentId_userId: {
          tournamentId: data.tournamentId,
          userId,
        },
      },
      include: {
        tournament: { select: { status: true, format: true } },
      },
    })) as RegistrationWithTournamentInfo | null

    if (!registration) {
      return { success: false, message: 'Inscription introuvable.' }
    }

    if (registration.tournament.status !== 'PUBLISHED') {
      return {
        success: false,
        message: 'Ce tournoi ne permet plus de désinscription.',
      }
    }

    // 3. SOLO format — just delete the registration
    if (registration.tournament.format === 'SOLO') {
      await prisma.tournamentRegistration.delete({
        where: { id: registration.id },
      })

      revalidateTag(CACHE_TAGS.TOURNAMENTS, 'hours')
      revalidateTag(CACHE_TAGS.DASHBOARD_REGISTRATIONS, 'minutes')
      revalidateTag(CACHE_TAGS.DASHBOARD_STATS, 'minutes')

      return { success: true, message: 'Votre inscription a été annulée.' }
    }

    // 4. TEAM format — find the user's team membership
    const teamMember = (await prisma.teamMember.findFirst({
      where: { userId, team: { tournamentId: data.tournamentId } },
      include: {
        team: {
          include: { members: { orderBy: { joinedAt: 'asc' } } },
        },
      },
    })) as TeamMemberWithTeam | null

    if (!teamMember) {
      // Edge case: has a registration but no team membership (shouldn't happen, but clean up)
      await prisma.tournamentRegistration.delete({
        where: { id: registration.id },
      })

      revalidateTag(CACHE_TAGS.TOURNAMENTS, 'hours')
      revalidateTag(CACHE_TAGS.DASHBOARD_REGISTRATIONS, 'minutes')
      revalidateTag(CACHE_TAGS.DASHBOARD_STATS, 'minutes')

      return { success: true, message: 'Votre inscription a été annulée.' }
    }

    const team = teamMember.team
    const isCaptain = team.captainId === userId
    const otherMembers = team.members.filter(m => m.userId !== userId)

    await prisma.$transaction(async tx => {
      // a. Remove team member record
      await tx.teamMember.deleteMany({
        where: { teamId: team.id, userId },
      })

      // b. Remove tournament registration
      await tx.tournamentRegistration.delete({
        where: { id: registration.id },
      })

      if (isCaptain && otherMembers.length > 0) {
        // c. Promote next member to captain
        const newCaptain = otherMembers[0]

        await tx.tournamentRegistration.updateMany({
          where: {
            tournamentId: data.tournamentId,
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
    revalidateTag(CACHE_TAGS.DASHBOARD_STATS, 'minutes')

    return { success: true, message: 'Votre inscription a été annulée.' }
  },
})

// ---------------------------------------------------------------------------
// Admin team management
// ---------------------------------------------------------------------------

/** Kicks a player from a team. If the player is captain, promotes the next member or dissolves the team. */
export const kickPlayer = authenticatedAction({
  schema: kickPlayerSchema,
  role: [Role.ADMIN, Role.SUPERADMIN],
  handler: async (data, session): Promise<ActionState> => {
    const hasAccess = await checkAdminAssignment(
      session.user.id,
      session.user.role,
      data.tournamentId,
    )
    if (!hasAccess) {
      return {
        success: false,
        message: "Vous n'avez pas accès à ce tournoi.",
      }
    }

    // Fetch team with members ordered by join date
    const team = (await prisma.team.findUnique({
      where: { id: data.teamId },
      include: {
        members: { orderBy: { joinedAt: 'asc' } },
      },
    })) as TeamWithMembers | null

    if (!team || team.tournamentId !== data.tournamentId) {
      return { success: false, message: 'Équipe introuvable.' }
    }

    const isMember = team.members.some(m => m.userId === data.userId)
    if (!isMember) {
      return {
        success: false,
        message: "Ce joueur ne fait pas partie de l'équipe.",
      }
    }

    const isCaptain = team.captainId === data.userId
    const otherMembers = team.members.filter(m => m.userId !== data.userId)

    await prisma.$transaction(async tx => {
      // 1. Remove team member record
      await tx.teamMember.deleteMany({
        where: { teamId: data.teamId, userId: data.userId },
      })

      // 2. Remove tournament registration
      await tx.tournamentRegistration.deleteMany({
        where: { tournamentId: data.tournamentId, userId: data.userId },
      })

      if (isCaptain && otherMembers.length > 0) {
        // 3a. Promote next member to captain
        const newCaptain = otherMembers[0]

        // Transfer the team's registration link to the new captain
        // First, unlink the old captain's registration (already deleted above)
        // Then set the new captain's registration to reference this team
        await tx.tournamentRegistration.updateMany({
          where: {
            tournamentId: data.tournamentId,
            userId: newCaptain.userId,
          },
          data: { teamId: data.teamId },
        })

        await tx.team.update({
          where: { id: data.teamId },
          data: { captainId: newCaptain.userId, isFull: false },
        })
      } else if (isCaptain && otherMembers.length === 0) {
        // 3b. Last member — dissolve the team
        await tx.team.delete({ where: { id: data.teamId } })
      } else {
        // 3c. Non-captain kicked — just mark team as not full
        await tx.team.update({
          where: { id: data.teamId },
          data: { isFull: false },
        })
      }
    })

    revalidateTag(CACHE_TAGS.TOURNAMENTS, 'hours')
    revalidateTag(CACHE_TAGS.DASHBOARD_REGISTRATIONS, 'minutes')
    revalidateTag(CACHE_TAGS.DASHBOARD_STATS, 'minutes')

    return { success: true, message: "Le joueur a été retiré de l'équipe." }
  },
})

/** Dissolves a team and removes all member registrations. */
export const dissolveTeam = authenticatedAction({
  schema: dissolveTeamSchema,
  role: [Role.ADMIN, Role.SUPERADMIN],
  handler: async (data, session): Promise<ActionState> => {
    const hasAccess = await checkAdminAssignment(
      session.user.id,
      session.user.role,
      data.tournamentId,
    )
    if (!hasAccess) {
      return {
        success: false,
        message: "Vous n'avez pas accès à ce tournoi.",
      }
    }

    // Fetch team with members to get all user IDs
    const team = (await prisma.team.findUnique({
      where: { id: data.teamId },
      include: { members: true },
    })) as TeamWithMembers | null

    if (!team || team.tournamentId !== data.tournamentId) {
      return { success: false, message: 'Équipe introuvable.' }
    }

    const memberUserIds = team.members.map(m => m.userId)

    await prisma.$transaction(async tx => {
      // 1. Delete all member registrations for this tournament
      await tx.tournamentRegistration.deleteMany({
        where: {
          tournamentId: data.tournamentId,
          userId: { in: memberUserIds },
        },
      })

      // 2. Delete the team (cascades to TeamMember records)
      await tx.team.delete({ where: { id: data.teamId } })
    })

    revalidateTag(CACHE_TAGS.TOURNAMENTS, 'hours')
    revalidateTag(CACHE_TAGS.DASHBOARD_REGISTRATIONS, 'minutes')
    revalidateTag(CACHE_TAGS.DASHBOARD_STATS, 'minutes')

    return { success: true, message: "L'équipe a été dissoute." }
  },
})
