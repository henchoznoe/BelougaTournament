/**
 * File: lib/actions/users.ts
 * Description: Server actions for unified user management (promote, demote, ban, unban, update, search).
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
import { isOwner } from '@/lib/utils/owner'
import {
  banUserSchema,
  deleteUserSchema,
  demoteUserSchema,
  promoteUserSchema,
  unbanUserSchema,
  updateUserSchema,
} from '@/lib/validations/users'
import { Role } from '@/prisma/generated/prisma/enums'

/** Promotes a USER to ADMIN role. */
export const promoteToAdmin = authenticatedAction({
  schema: promoteUserSchema,
  role: Role.SUPERADMIN,
  handler: async (data): Promise<ActionState> => {
    const user = await prisma.user.findUnique({
      where: { id: data.userId },
      select: { role: true, name: true },
    })

    if (!user) {
      return { success: false, message: 'Utilisateur introuvable.' }
    }

    if (user.role !== Role.USER) {
      return { success: false, message: `${user.name} est déjà admin.` }
    }

    // Update role and revoke sessions so the user picks up the new role on next login
    await prisma.$transaction([
      prisma.user.update({
        where: { id: data.userId },
        data: { role: Role.ADMIN },
      }),
      prisma.session.deleteMany({ where: { userId: data.userId } }),
    ])

    revalidateTag(CACHE_TAGS.USERS, 'minutes')
    revalidateTag(CACHE_TAGS.DASHBOARD_STATS, 'minutes')
    revalidateTag(CACHE_TAGS.DASHBOARD_RECENT_USERS, 'minutes')

    return { success: true, message: `${user.name} a été promu admin.` }
  },
})

/** Promotes an ADMIN to SUPERADMIN role. Owner-only action. */
export const promoteToSuperAdmin = authenticatedAction({
  schema: promoteUserSchema,
  role: Role.SUPERADMIN,
  handler: async (data, session): Promise<ActionState> => {
    if (!isOwner(session.user.email)) {
      return {
        success: false,
        message: 'Seuls les owners peuvent promouvoir un super admin.',
      }
    }

    const user = await prisma.user.findUnique({
      where: { id: data.userId },
      select: { role: true, name: true },
    })

    if (!user) {
      return { success: false, message: 'Utilisateur introuvable.' }
    }

    if (user.role !== Role.ADMIN) {
      return {
        success: false,
        message: `${user.name} doit être admin pour être promu super admin.`,
      }
    }

    // Remove assignments (super admins have full access), promote, and revoke sessions
    await prisma.$transaction([
      prisma.adminAssignment.deleteMany({ where: { adminId: data.userId } }),
      prisma.user.update({
        where: { id: data.userId },
        data: { role: Role.SUPERADMIN },
      }),
      prisma.session.deleteMany({ where: { userId: data.userId } }),
    ])

    revalidateTag(CACHE_TAGS.USERS, 'minutes')
    revalidateTag(CACHE_TAGS.DASHBOARD_STATS, 'minutes')
    revalidateTag(CACHE_TAGS.DASHBOARD_RECENT_USERS, 'minutes')

    return {
      success: true,
      message: `${user.name} a été promu super admin.`,
    }
  },
})

/** Demotes an ADMIN back to USER role. Also removes all tournament assignments. Owners can also demote SUPERADMINs to ADMIN. */
export const demoteAdmin = authenticatedAction({
  schema: demoteUserSchema,
  role: Role.SUPERADMIN,
  handler: async (data, session): Promise<ActionState> => {
    const user = await prisma.user.findUnique({
      where: { id: data.userId },
      select: { role: true, name: true },
    })

    if (!user) {
      return { success: false, message: 'Utilisateur introuvable.' }
    }

    // Prevent self-demotion
    if (data.userId === session.user.id) {
      return { success: false, message: 'Vous ne pouvez pas vous rétrograder.' }
    }

    // SUPERADMIN targets: only owners can demote them (to ADMIN)
    if (user.role === Role.SUPERADMIN) {
      if (!isOwner(session.user.email)) {
        return {
          success: false,
          message: 'Impossible de rétrograder un super admin.',
        }
      }

      await prisma.$transaction([
        prisma.user.update({
          where: { id: data.userId },
          data: { role: Role.ADMIN },
        }),
        prisma.session.deleteMany({ where: { userId: data.userId } }),
      ])

      revalidateTag(CACHE_TAGS.USERS, 'minutes')
      revalidateTag(CACHE_TAGS.DASHBOARD_STATS, 'minutes')
      revalidateTag(CACHE_TAGS.DASHBOARD_RECENT_USERS, 'minutes')

      return {
        success: true,
        message: `${user.name} a été rétrogradé à admin.`,
      }
    }

    if (user.role !== Role.ADMIN) {
      return { success: false, message: `${user.name} n'est pas admin.` }
    }

    // Remove all assignments, demote, and revoke sessions in a transaction
    await prisma.$transaction([
      prisma.adminAssignment.deleteMany({ where: { adminId: data.userId } }),
      prisma.user.update({
        where: { id: data.userId },
        data: { role: Role.USER },
      }),
      prisma.session.deleteMany({ where: { userId: data.userId } }),
    ])

    revalidateTag(CACHE_TAGS.USERS, 'minutes')
    revalidateTag(CACHE_TAGS.DASHBOARD_STATS, 'minutes')
    revalidateTag(CACHE_TAGS.DASHBOARD_RECENT_USERS, 'minutes')

    return { success: true, message: `${user.name} a été rétrogradé.` }
  },
})

/** Updates a user's display name (and tournament assignments for admins). */
export const updateUser = authenticatedAction({
  schema: updateUserSchema,
  role: [Role.ADMIN, Role.SUPERADMIN],
  handler: async (data, session): Promise<ActionState> => {
    const user = await prisma.user.findUnique({
      where: { id: data.userId },
      select: { role: true, name: true },
    })

    if (!user) {
      return { success: false, message: 'Utilisateur introuvable.' }
    }

    if (user.role === Role.SUPERADMIN) {
      return {
        success: false,
        message: 'Impossible de modifier un super admin.',
      }
    }

    // Only SUPERADMIN can modify tournament assignments
    if (data.tournamentIds && (session.user.role as Role) !== Role.SUPERADMIN) {
      return {
        success: false,
        message: 'Seuls les super admins peuvent modifier les assignations.',
      }
    }

    // For ADMIN users: also update tournament assignments if provided
    if (user.role === Role.ADMIN && data.tournamentIds) {
      await prisma.$transaction([
        prisma.user.update({
          where: { id: data.userId },
          data: { displayName: data.displayName },
        }),
        prisma.adminAssignment.deleteMany({ where: { adminId: data.userId } }),
        ...(data.tournamentIds.length > 0
          ? [
              prisma.adminAssignment.createMany({
                data: data.tournamentIds.map(tournamentId => ({
                  adminId: data.userId,
                  tournamentId,
                })),
              }),
            ]
          : []),
      ])
    } else {
      // For USER users: just update display name
      await prisma.user.update({
        where: { id: data.userId },
        data: { displayName: data.displayName },
      })
    }

    revalidateTag(CACHE_TAGS.USERS, 'minutes')
    revalidateTag(CACHE_TAGS.DASHBOARD_RECENT_USERS, 'minutes')

    return { success: true, message: `${user.name} a été mis à jour.` }
  },
})

/** Bans a user until the specified date. */
export const banUser = authenticatedAction({
  schema: banUserSchema,
  role: [Role.ADMIN, Role.SUPERADMIN],
  handler: async (data): Promise<ActionState> => {
    const user = await prisma.user.findUnique({
      where: { id: data.userId },
      select: { role: true, name: true },
    })

    if (!user) {
      return { success: false, message: 'Utilisateur introuvable.' }
    }

    if (user.role !== Role.USER) {
      return {
        success: false,
        message: 'Impossible de bannir un administrateur.',
      }
    }

    await prisma.user.update({
      where: { id: data.userId },
      data: {
        bannedUntil: data.bannedUntil,
        banReason: data.banReason || null,
      },
    })

    revalidateTag(CACHE_TAGS.USERS, 'minutes')
    revalidateTag(CACHE_TAGS.DASHBOARD_STATS, 'minutes')
    revalidateTag(CACHE_TAGS.DASHBOARD_RECENT_USERS, 'minutes')

    return { success: true, message: `${user.name} a été banni.` }
  },
})

/** Removes the ban from a user. */
export const unbanUser = authenticatedAction({
  schema: unbanUserSchema,
  role: [Role.ADMIN, Role.SUPERADMIN],
  handler: async (data): Promise<ActionState> => {
    const user = await prisma.user.findUnique({
      where: { id: data.userId },
      select: { role: true, name: true, bannedUntil: true },
    })

    if (!user) {
      return { success: false, message: 'Utilisateur introuvable.' }
    }

    if (!user.bannedUntil) {
      return { success: false, message: `${user.name} n'est pas banni.` }
    }

    await prisma.user.update({
      where: { id: data.userId },
      data: {
        bannedUntil: null,
        banReason: null,
      },
    })

    revalidateTag(CACHE_TAGS.USERS, 'minutes')
    revalidateTag(CACHE_TAGS.DASHBOARD_STATS, 'minutes')
    revalidateTag(CACHE_TAGS.DASHBOARD_RECENT_USERS, 'minutes')

    return { success: true, message: `${user.name} a été débanni.` }
  },
})

/** Permanently deletes a USER-role user and all associated data (cascades). */
export const deleteUser = authenticatedAction({
  schema: deleteUserSchema,
  role: Role.SUPERADMIN,
  handler: async (data, session): Promise<ActionState> => {
    const user = await prisma.user.findUnique({
      where: { id: data.userId },
      select: { role: true, name: true },
    })

    if (!user) {
      return { success: false, message: 'Utilisateur introuvable.' }
    }

    if (user.role !== Role.USER) {
      return {
        success: false,
        message:
          "Seuls les utilisateurs avec le rôle Joueur peuvent être supprimés. Rétrogradez d'abord les admins.",
      }
    }

    // Prevent self-deletion
    if (data.userId === session.user.id) {
      return { success: false, message: 'Vous ne pouvez pas vous supprimer.' }
    }

    // Prisma cascade-deletes sessions, accounts, registrations, teams (if captain), team members, admin assignments
    await prisma.user.delete({ where: { id: data.userId } })

    revalidateTag(CACHE_TAGS.USERS, 'minutes')
    revalidateTag(CACHE_TAGS.DASHBOARD_STATS, 'minutes')
    revalidateTag(CACHE_TAGS.DASHBOARD_RECENT_USERS, 'minutes')
    revalidateTag(CACHE_TAGS.REGISTRATIONS, 'minutes')
    revalidateTag(CACHE_TAGS.DASHBOARD_REGISTRATIONS, 'minutes')
    revalidateTag(CACHE_TAGS.DASHBOARD_UPCOMING, 'minutes')

    return {
      success: true,
      message: `${user.name} a été supprimé définitivement.`,
    }
  },
})
