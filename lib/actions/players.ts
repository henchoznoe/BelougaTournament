/**
 * File: lib/actions/players.ts
 * Description: Server actions for player management (ban/unban).
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

'use server'

import { revalidateTag } from 'next/cache'
import { authenticatedAction } from '@/lib/actions/safe-action'
import prisma from '@/lib/core/prisma'
import type { ActionState } from '@/lib/types/actions'
import { banPlayerSchema, unbanPlayerSchema } from '@/lib/validations/players'
import { Role } from '@/prisma/generated/prisma/enums'

/** Bans a player until the specified date. */
export const banPlayer = authenticatedAction({
  schema: banPlayerSchema,
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

    revalidateTag('players', 'minutes')
    revalidateTag('dashboard-stats', 'minutes')

    return { success: true, message: `${user.name} a été banni.` }
  },
})

/** Removes the ban from a player. */
export const unbanPlayer = authenticatedAction({
  schema: unbanPlayerSchema,
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

    revalidateTag('players', 'minutes')
    revalidateTag('dashboard-stats', 'minutes')

    return { success: true, message: `${user.name} a été débanni.` }
  },
})
