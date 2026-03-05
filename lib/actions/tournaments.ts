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
import prisma from '@/lib/core/prisma'
import type { ActionState } from '@/lib/types/actions'
import { isBanned } from '@/lib/utils/auth.helpers'
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
import { Role } from '@/prisma/generated/prisma/enums'

/** Converts empty strings to null for nullable Prisma fields. */
const toNullable = (val: string | undefined): string | null => val || null

/**
 * Checks whether an ADMIN user is assigned to a given tournament.
 * SUPERADMINs always pass this check.
 */
const checkAdminAssignment = async (
  userId: string,
  userRole: string,
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

    revalidateTag('tournaments', 'hours')
    revalidateTag('tournament-options', 'minutes')
    revalidateTag('dashboard-stats', 'minutes')

    return { success: true, message: 'Le tournoi a été créé.' }
  },
})

/** Updates an existing tournament and syncs its dynamic fields. */
export const updateTournament = authenticatedAction({
  schema: updateTournamentSchema,
  role: [Role.ADMIN, Role.SUPERADMIN],
  handler: async (data, session): Promise<ActionState> => {
    const hasAccess = await checkAdminAssignment(
      session.user.id as string,
      session.user.role as string,
      data.id,
    )
    if (!hasAccess) {
      return {
        success: false,
        message: "Vous n'avez pas accès à ce tournoi.",
      }
    }

    // Fetch existing tournament to enforce immutability rules
    // biome-ignore lint/suspicious/noExplicitAny: Prisma include result needs explicit field typing
    const existing: any = await prisma.tournament.findUnique({
      where: { id: data.id },
      include: {
        fields: { orderBy: { order: 'asc' } },
        _count: { select: { registrations: true } },
      },
    })

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
      const existingFields = existing.fields.map(
        (f: {
          label: string
          type: string
          required: boolean
          order: number
        }) => ({
          label: f.label,
          type: f.type,
          required: f.required,
          order: f.order,
        }),
      )
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

    revalidateTag('tournaments', 'hours')
    revalidateTag('tournament-options', 'minutes')
    revalidateTag('dashboard-upcoming', 'minutes')

    return { success: true, message: 'Le tournoi a été mis à jour.' }
  },
})

/** Deletes a tournament by ID. */
export const deleteTournament = authenticatedAction({
  schema: deleteTournamentSchema,
  role: [Role.ADMIN, Role.SUPERADMIN],
  handler: async (data, session): Promise<ActionState> => {
    const hasAccess = await checkAdminAssignment(
      session.user.id as string,
      session.user.role as string,
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

    revalidateTag('tournaments', 'hours')
    revalidateTag('tournament-options', 'minutes')
    revalidateTag('dashboard-stats', 'minutes')
    revalidateTag('dashboard-upcoming', 'minutes')
    revalidateTag('dashboard-registrations', 'minutes')

    return { success: true, message: 'Le tournoi a été supprimé.' }
  },
})

/** Updates a tournament's status (DRAFT / PUBLISHED / ARCHIVED). */
export const updateTournamentStatus = authenticatedAction({
  schema: updateTournamentStatusSchema,
  role: [Role.ADMIN, Role.SUPERADMIN],
  handler: async (data, session): Promise<ActionState> => {
    const hasAccess = await checkAdminAssignment(
      session.user.id as string,
      session.user.role as string,
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

    revalidateTag('tournaments', 'hours')
    revalidateTag('tournament-options', 'minutes')
    revalidateTag('dashboard-stats', 'minutes')
    revalidateTag('dashboard-upcoming', 'minutes')

    return { success: true, message: 'Le statut du tournoi a été mis à jour.' }
  },
})

/** Updates a registration's status (approve / reject). */
export const updateRegistrationStatus = authenticatedAction({
  schema: updateRegistrationStatusSchema,
  role: [Role.ADMIN, Role.SUPERADMIN],
  handler: async (data, session): Promise<ActionState> => {
    const hasAccess = await checkAdminAssignment(
      session.user.id as string,
      session.user.role as string,
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

    revalidateTag('tournaments', 'hours')
    revalidateTag('dashboard-registrations', 'minutes')
    revalidateTag('dashboard-stats', 'minutes')

    return {
      success: true,
      message: "Le statut de l'inscription a été mis à jour.",
    }
  },
})

// ---------------------------------------------------------------------------
// Public registration
// ---------------------------------------------------------------------------

// biome-ignore lint/suspicious/noExplicitAny: Prisma include result needs explicit field typing
type TournamentWithFields = any

/** Updates a user's own registration field values. Resets status to PENDING if it was APPROVED. */
export const updateRegistrationFields = authenticatedAction({
  schema: updateRegistrationFieldsSchema,
  handler: async (data, session): Promise<ActionState> => {
    // 1. Fetch existing registration and verify ownership
    // biome-ignore lint/suspicious/noExplicitAny: Prisma include result needs explicit field typing
    const registration: any = await prisma.tournamentRegistration.findUnique({
      where: { id: data.registrationId },
      include: {
        tournament: {
          include: { fields: { orderBy: { order: 'asc' } } },
        },
      },
    })

    if (!registration) {
      return { success: false, message: 'Inscription introuvable.' }
    }

    if (registration.userId !== (session.user.id as string)) {
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
    for (const field of tournament.fields) {
      const value = data.fieldValues[field.label]
      if (field.required && (value === undefined || value === '')) {
        return {
          success: false,
          message: `Le champ « ${field.label} » est requis.`,
        }
      }
      if (field.type === 'NUMBER' && value !== undefined && value !== '') {
        if (typeof value !== 'number' || Number.isNaN(value)) {
          return {
            success: false,
            message: `Le champ « ${field.label} » doit être un nombre.`,
          }
        }
      }
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

    revalidateTag('tournaments', 'hours')
    revalidateTag('dashboard-registrations', 'minutes')
    revalidateTag('dashboard-stats', 'minutes')

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
    const banResult = await checkBanStatus(session.user.id as string)
    if (banResult) return banResult

    // 2. Fetch tournament with fields
    const tournament: TournamentWithFields = await prisma.tournament.findUnique(
      {
        where: { id: data.tournamentId },
        include: { fields: { orderBy: { order: 'asc' } } },
      },
    )

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
          userId: session.user.id as string,
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
    for (const field of tournament.fields) {
      const value = data.fieldValues[field.label]
      if (field.required && (value === undefined || value === '')) {
        return {
          success: false,
          message: `Le champ « ${field.label} » est requis.`,
        }
      }
      if (field.type === 'NUMBER' && value !== undefined && value !== '') {
        if (typeof value !== 'number' || Number.isNaN(value)) {
          return {
            success: false,
            message: `Le champ « ${field.label} » doit être un nombre.`,
          }
        }
      }
    }

    // 8. Create the registration
    await prisma.tournamentRegistration.create({
      data: {
        tournamentId: data.tournamentId,
        userId: session.user.id as string,
        fieldValues: data.fieldValues,
        status: tournament.autoApprove ? 'APPROVED' : 'PENDING',
      },
    })

    revalidateTag('tournaments', 'hours')
    revalidateTag('dashboard-registrations', 'minutes')

    return { success: true, message: 'Votre inscription a été enregistrée.' }
  },
})

// ---------------------------------------------------------------------------
// Team registration (public)
// ---------------------------------------------------------------------------

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

/** Creates a team and registers the current user as captain. */
export const createTeamAndRegister = authenticatedAction({
  schema: createTeamSchema,
  handler: async (data, session): Promise<ActionState> => {
    // 1. Check ban status
    const banResult = await checkBanStatus(session.user.id as string)
    if (banResult) return banResult

    // 2. Fetch tournament with fields
    const tournament: TournamentWithFields = await prisma.tournament.findUnique(
      {
        where: { id: data.tournamentId },
        include: { fields: { orderBy: { order: 'asc' } } },
      },
    )

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
          userId: session.user.id as string,
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
          captainId: session.user.id as string,
          tournamentId: data.tournamentId,
          isFull: tournament.teamSize <= 1,
        },
      })

      await tx.teamMember.create({
        data: {
          teamId: team.id,
          userId: session.user.id as string,
        },
      })

      await tx.tournamentRegistration.create({
        data: {
          tournamentId: data.tournamentId,
          userId: session.user.id as string,
          fieldValues: data.fieldValues,
          status: tournament.autoApprove ? 'APPROVED' : 'PENDING',
          teamId: team.id,
        },
      })
    })

    revalidateTag('tournaments', 'hours')
    revalidateTag('dashboard-registrations', 'minutes')
    revalidateTag('dashboard-stats', 'minutes')

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
    const banResult = await checkBanStatus(session.user.id as string)
    if (banResult) return banResult

    // 2. Fetch tournament with fields
    const tournament: TournamentWithFields = await prisma.tournament.findUnique(
      {
        where: { id: data.tournamentId },
        include: { fields: { orderBy: { order: 'asc' } } },
      },
    )

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
          userId: session.user.id as string,
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
    // biome-ignore lint/suspicious/noExplicitAny: Prisma include result needs explicit field typing
    const team: any = await prisma.team.findUnique({
      where: { id: data.teamId },
      include: { _count: { select: { members: true } } },
    })

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
          userId: session.user.id as string,
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
          userId: session.user.id as string,
          fieldValues: data.fieldValues,
          status: tournament.autoApprove ? 'APPROVED' : 'PENDING',
        },
      })
    })

    revalidateTag('tournaments', 'hours')
    revalidateTag('dashboard-registrations', 'minutes')
    revalidateTag('dashboard-stats', 'minutes')

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
    const userId = session.user.id as string

    // 1. Check ban status
    const banResult = await checkBanStatus(userId)
    if (banResult) return banResult

    // 2. Fetch the registration with tournament info
    // biome-ignore lint/suspicious/noExplicitAny: Prisma include result needs explicit field typing
    const registration: any = await prisma.tournamentRegistration.findUnique({
      where: {
        tournamentId_userId: {
          tournamentId: data.tournamentId,
          userId,
        },
      },
      include: {
        tournament: { select: { status: true, format: true } },
      },
    })

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

      revalidateTag('tournaments', 'hours')
      revalidateTag('dashboard-registrations', 'minutes')
      revalidateTag('dashboard-stats', 'minutes')

      return { success: true, message: 'Votre inscription a été annulée.' }
    }

    // 4. TEAM format — find the user's team membership
    // biome-ignore lint/suspicious/noExplicitAny: Prisma include result needs explicit field typing
    const teamMember: any = await prisma.teamMember.findFirst({
      where: { userId, team: { tournamentId: data.tournamentId } },
      include: {
        team: {
          include: { members: { orderBy: { joinedAt: 'asc' } } },
        },
      },
    })

    if (!teamMember) {
      // Edge case: has a registration but no team membership (shouldn't happen, but clean up)
      await prisma.tournamentRegistration.delete({
        where: { id: registration.id },
      })

      revalidateTag('tournaments', 'hours')
      revalidateTag('dashboard-registrations', 'minutes')
      revalidateTag('dashboard-stats', 'minutes')

      return { success: true, message: 'Votre inscription a été annulée.' }
    }

    const team = teamMember.team
    const isCaptain = team.captainId === userId
    const otherMembers = team.members.filter(
      (m: { userId: string }) => m.userId !== userId,
    )

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

    revalidateTag('tournaments', 'hours')
    revalidateTag('dashboard-registrations', 'minutes')
    revalidateTag('dashboard-stats', 'minutes')

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
      session.user.id as string,
      session.user.role as string,
      data.tournamentId,
    )
    if (!hasAccess) {
      return {
        success: false,
        message: "Vous n'avez pas accès à ce tournoi.",
      }
    }

    // Fetch team with members ordered by join date
    // biome-ignore lint/suspicious/noExplicitAny: Prisma include result needs explicit field typing
    const team: any = await prisma.team.findUnique({
      where: { id: data.teamId },
      include: {
        members: { orderBy: { joinedAt: 'asc' } },
      },
    })

    if (!team || team.tournamentId !== data.tournamentId) {
      return { success: false, message: 'Équipe introuvable.' }
    }

    const isMember = team.members.some(
      (m: { userId: string }) => m.userId === data.userId,
    )
    if (!isMember) {
      return {
        success: false,
        message: "Ce joueur ne fait pas partie de l'équipe.",
      }
    }

    const isCaptain = team.captainId === data.userId
    const otherMembers = team.members.filter(
      (m: { userId: string }) => m.userId !== data.userId,
    )

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

    revalidateTag('tournaments', 'hours')
    revalidateTag('dashboard-registrations', 'minutes')
    revalidateTag('dashboard-stats', 'minutes')

    return { success: true, message: "Le joueur a été retiré de l'équipe." }
  },
})

/** Dissolves a team and removes all member registrations. */
export const dissolveTeam = authenticatedAction({
  schema: dissolveTeamSchema,
  role: [Role.ADMIN, Role.SUPERADMIN],
  handler: async (data, session): Promise<ActionState> => {
    const hasAccess = await checkAdminAssignment(
      session.user.id as string,
      session.user.role as string,
      data.tournamentId,
    )
    if (!hasAccess) {
      return {
        success: false,
        message: "Vous n'avez pas accès à ce tournoi.",
      }
    }

    // Fetch team with members to get all user IDs
    // biome-ignore lint/suspicious/noExplicitAny: Prisma include result needs explicit field typing
    const team: any = await prisma.team.findUnique({
      where: { id: data.teamId },
      include: { members: true },
    })

    if (!team || team.tournamentId !== data.tournamentId) {
      return { success: false, message: 'Équipe introuvable.' }
    }

    const memberUserIds = team.members.map((m: { userId: string }) => m.userId)

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

    revalidateTag('tournaments', 'hours')
    revalidateTag('dashboard-registrations', 'minutes')
    revalidateTag('dashboard-stats', 'minutes')

    return { success: true, message: "L'équipe a été dissoute." }
  },
})
