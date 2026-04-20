/**
 * File: lib/actions/users.ts
 * Description: Server actions for unified user management (promote, demote, update, delete).
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

'use server'

import { updateTag } from 'next/cache'
import { authenticatedAction } from '@/lib/actions/safe-action'
import { CACHE_TAGS } from '@/lib/config/constants'
import prisma from '@/lib/core/prisma'
import type { ActionState } from '@/lib/types/actions'
import { isOwner } from '@/lib/utils/owner'
import {
  deleteUserSchema,
  demoteUserSchema,
  promoteUserSchema,
  updateUserSchema,
} from '@/lib/validations/users'
import { Role } from '@/prisma/generated/prisma/enums'

/** Promotes a USER to ADMIN role. Owner-only action. */
export const promoteToAdmin = authenticatedAction({
  schema: promoteUserSchema,
  role: Role.ADMIN,
  handler: async (data, session): Promise<ActionState> => {
    if (!isOwner(session.user.email)) {
      return {
        success: false,
        message: 'Seuls les owners peuvent modifier les rôles.',
      }
    }

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

    await prisma.$transaction([
      prisma.user.update({
        where: { id: data.userId },
        data: { role: Role.ADMIN },
      }),
      prisma.session.deleteMany({ where: { userId: data.userId } }),
    ])

    updateTag(CACHE_TAGS.USERS)
    updateTag(CACHE_TAGS.DASHBOARD_STATS)
    updateTag(CACHE_TAGS.DASHBOARD_RECENT_USERS)

    return { success: true, message: `${user.name} a été promu admin.` }
  },
})

/** Demotes an ADMIN back to USER role. Owner-only action. */
export const demoteAdmin = authenticatedAction({
  schema: demoteUserSchema,
  role: Role.ADMIN,
  handler: async (data, session): Promise<ActionState> => {
    if (!isOwner(session.user.email)) {
      return {
        success: false,
        message: 'Seuls les owners peuvent modifier les rôles.',
      }
    }

    const user = await prisma.user.findUnique({
      where: { id: data.userId },
      select: { role: true, name: true },
    })

    if (!user) {
      return { success: false, message: 'Utilisateur introuvable.' }
    }

    if (data.userId === session.user.id) {
      return { success: false, message: 'Vous ne pouvez pas vous rétrograder.' }
    }

    if (user.role !== Role.ADMIN) {
      return { success: false, message: `${user.name} n'est pas admin.` }
    }

    await prisma.$transaction([
      prisma.user.update({
        where: { id: data.userId },
        data: { role: Role.USER },
      }),
      prisma.session.deleteMany({ where: { userId: data.userId } }),
    ])

    updateTag(CACHE_TAGS.USERS)
    updateTag(CACHE_TAGS.DASHBOARD_STATS)
    updateTag(CACHE_TAGS.DASHBOARD_RECENT_USERS)

    return { success: true, message: `${user.name} a été rétrogradé.` }
  },
})

/** Updates a user's display name. */
export const updateUser = authenticatedAction({
  schema: updateUserSchema,
  role: Role.ADMIN,
  handler: async (data): Promise<ActionState> => {
    const user = await prisma.user.findUnique({
      where: { id: data.userId },
      select: { name: true },
    })

    if (!user) {
      return { success: false, message: 'Utilisateur introuvable.' }
    }

    await prisma.user.update({
      where: { id: data.userId },
      data: { displayName: data.displayName },
    })

    updateTag(CACHE_TAGS.USERS)
    updateTag(CACHE_TAGS.DASHBOARD_RECENT_USERS)

    return { success: true, message: `${user.name} a été mis à jour.` }
  },
})

/** Permanently deletes a USER-role user and all associated data. Owner-only action. */
export const deleteUser = authenticatedAction({
  schema: deleteUserSchema,
  role: Role.ADMIN,
  handler: async (data, session): Promise<ActionState> => {
    if (!isOwner(session.user.email)) {
      return {
        success: false,
        message: 'Seuls les owners peuvent supprimer un utilisateur.',
      }
    }

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

    if (data.userId === session.user.id) {
      return { success: false, message: 'Vous ne pouvez pas vous supprimer.' }
    }

    await prisma.user.delete({ where: { id: data.userId } })

    updateTag(CACHE_TAGS.USERS)
    updateTag(CACHE_TAGS.DASHBOARD_STATS)
    updateTag(CACHE_TAGS.DASHBOARD_RECENT_USERS)
    updateTag(CACHE_TAGS.DASHBOARD_REGISTRATIONS)

    return {
      success: true,
      message: `${user.name} a été supprimé définitivement.`,
    }
  },
})
