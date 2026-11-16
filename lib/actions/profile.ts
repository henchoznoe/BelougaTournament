/**
 * File: lib/actions/profile.ts
 * Description: Server action for updating user profile (displayName).
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

'use server'

import { authenticatedAction } from '@/lib/actions/safe-action'
import { CACHE_TAGS } from '@/lib/config/constants'
import prisma from '@/lib/core/prisma'
import type { ActionState } from '@/lib/types/actions'
import {
  expireActionTags,
  invalidatePlayer,
} from '@/lib/utils/cache-invalidation'
import {
  profileSchema,
  profileVisibilitySchema,
} from '@/lib/validations/profile'

export const updateProfile = authenticatedAction({
  schema: profileSchema,
  handler: async (data, session): Promise<ActionState> => {
    await prisma.user.update({
      where: { id: session.user.id },
      data: { displayName: data.displayName },
    })

    expireActionTags([CACHE_TAGS.USERS])
    await invalidatePlayer(session.user.id)

    return { success: true, message: 'Votre nom a été mis à jour.' }
  },
})

export const updateProfileVisibility = authenticatedAction({
  schema: profileVisibilitySchema,
  handler: async (data, session): Promise<ActionState> => {
    await prisma.user.update({
      where: { id: session.user.id },
      data: { isPublic: data.isPublic },
    })

    await invalidatePlayer(session.user.id)
    expireActionTags([CACHE_TAGS.USERS])

    return {
      success: true,
      message: data.isPublic
        ? 'Votre profil est maintenant public.'
        : 'Votre profil est maintenant privé.',
    }
  },
})
