/**
 * File: lib/actions/settings.ts
 * Description: Server action for updating global settings.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

'use server'

import { updateTag } from 'next/cache'
import { authenticatedAction } from '@/lib/actions/safe-action'
import { CACHE_TAGS, SETTINGS_SINGLETON_ID } from '@/lib/config/constants'
import prisma from '@/lib/core/prisma'
import type { ActionState } from '@/lib/types/actions'
import { toNullable } from '@/lib/utils/formatting'
import { settingsSchema } from '@/lib/validations/settings'
import { Role } from '@/prisma/generated/prisma/enums'

export const updateSettings = authenticatedAction({
  schema: settingsSchema,
  role: Role.ADMIN,
  handler: async (data): Promise<ActionState> => {
    const payload = {
      logoUrl: toNullable(data.logoUrl),
      twitchUsername: toNullable(data.twitchUsername),
      twitchUrl: toNullable(data.twitchUrl),
      discordUrl: toNullable(data.discordUrl),
      instagramUrl: toNullable(data.instagramUrl),
      tiktokUrl: toNullable(data.tiktokUrl),
      youtubeUrl: toNullable(data.youtubeUrl),
      feature1Title: toNullable(data.feature1Title),
      feature1Description: toNullable(data.feature1Description),
      feature2Title: toNullable(data.feature2Title),
      feature2Description: toNullable(data.feature2Description),
      feature3Title: toNullable(data.feature3Title),
      feature3Description: toNullable(data.feature3Description),
    }

    await prisma.globalSettings.upsert({
      where: { id: SETTINGS_SINGLETON_ID },
      update: payload,
      create: { id: SETTINGS_SINGLETON_ID, ...payload },
    })

    updateTag(CACHE_TAGS.SETTINGS)

    return { success: true, message: 'Les paramètres ont été mis à jour.' }
  },
})
