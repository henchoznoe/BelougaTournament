/**
 * File: lib/actions/admins.ts
 * Description: Server actions for admin management (SUPERADMIN only).
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

'use server'

import { revalidateTag } from 'next/cache'
import { authenticatedAction } from '@/lib/actions/safe-action'
import { CACHE_TAGS } from '@/lib/config/constants'
import prisma from '@/lib/core/prisma'
import { searchUsers } from '@/lib/services/admins'
import type { ActionState } from '@/lib/types/actions'
import {
  demoteAdminSchema,
  promoteAdminSchema,
  updateAdminSchema,
  updateAssignmentsSchema,
} from '@/lib/validations/admins'
import { Role } from '@/prisma/generated/prisma/enums'

/** Promotes a USER to ADMIN role. */
export const promoteToAdmin = authenticatedAction({
  schema: promoteAdminSchema,
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

    await prisma.user.update({
      where: { id: data.userId },
      data: { role: Role.ADMIN },
    })

    revalidateTag(CACHE_TAGS.ADMINS, 'minutes')
    revalidateTag(CACHE_TAGS.DASHBOARD_STATS, 'minutes')

    return { success: true, message: `${user.name} a été promu admin.` }
  },
})

/** Demotes an ADMIN back to USER role. Also removes all tournament assignments. */
export const demoteAdmin = authenticatedAction({
  schema: demoteAdminSchema,
  role: Role.SUPERADMIN,
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
        message: 'Impossible de rétrograder un super admin.',
      }
    }

    if (user.role !== Role.ADMIN) {
      return { success: false, message: `${user.name} n'est pas admin.` }
    }

    // Prevent self-demotion
    if (data.userId === session.user.id) {
      return { success: false, message: 'Vous ne pouvez pas vous rétrograder.' }
    }

    // Remove all assignments and demote in a transaction
    await prisma.$transaction([
      prisma.adminAssignment.deleteMany({ where: { adminId: data.userId } }),
      prisma.user.update({
        where: { id: data.userId },
        data: { role: Role.USER },
      }),
    ])

    revalidateTag(CACHE_TAGS.ADMINS, 'minutes')
    revalidateTag(CACHE_TAGS.DASHBOARD_STATS, 'minutes')

    return { success: true, message: `${user.name} a été rétrogradé.` }
  },
})

/** Updates tournament assignments for an admin. Replaces all existing assignments. */
export const updateAdminAssignments = authenticatedAction({
  schema: updateAssignmentsSchema,
  role: Role.SUPERADMIN,
  handler: async (data): Promise<ActionState> => {
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
        message: 'Les super admins ont accès à tous les tournois.',
      }
    }

    if (user.role !== Role.ADMIN) {
      return { success: false, message: `${user.name} n'est pas admin.` }
    }

    // Replace all assignments in a transaction
    await prisma.$transaction([
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

    revalidateTag(CACHE_TAGS.ADMINS, 'minutes')

    return {
      success: true,
      message: `Assignations de ${user.name} mises à jour.`,
    }
  },
})

/** Server action wrapper for user search (usable from client components). */
export const searchUsersAction = async (query: string) => {
  return searchUsers(query)
}

/** Updates an admin's display name and tournament assignments atomically. */
export const updateAdmin = authenticatedAction({
  schema: updateAdminSchema,
  role: Role.SUPERADMIN,
  handler: async (data): Promise<ActionState> => {
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

    if (user.role !== Role.ADMIN) {
      return { success: false, message: `${user.name} n'est pas admin.` }
    }

    // Update display name and replace all assignments in a single transaction
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

    revalidateTag(CACHE_TAGS.ADMINS, 'minutes')

    return { success: true, message: `${user.name} a été mis à jour.` }
  },
})
