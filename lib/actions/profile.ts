/**
 * File: lib/actions/profile.ts
 * Description: Server action for updating user profile (displayName).
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

    updateTag(CACHE_TAGS.USERS)
    updateTag(CACHE_TAGS.PLAYERS)

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

    updateTag(CACHE_TAGS.PLAYERS)
    updateTag(CACHE_TAGS.USERS)

    return {
      success: true,
      message: data.isPublic
        ? 'Votre profil est maintenant public.'
        : 'Votre profil est maintenant privé.',
    }
  },
})
