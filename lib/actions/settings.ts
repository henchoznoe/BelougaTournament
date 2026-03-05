/**
 * File: lib/actions/settings.ts
 * Description: Server action for updating global settings (SUPERADMIN only).
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

'use server'

import { revalidateTag } from 'next/cache'
import { authenticatedAction } from '@/lib/actions/safe-action'
import prisma from '@/lib/core/prisma'
import type { ActionState } from '@/lib/types/actions'
import { settingsSchema } from '@/lib/validations/settings'
import { Role } from '@/prisma/generated/prisma/enums'

/** Converts empty strings to null for nullable Prisma fields. */
const toNullable = (val: string): string | null => val || null

export const updateSettings = authenticatedAction({
  schema: settingsSchema,
  role: Role.SUPERADMIN,
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
      where: { id: 1 },
      update: payload,
      create: { id: 1, ...payload },
    })

    revalidateTag('settings', 'hours')

    return { success: true, message: 'Les paramètres ont été mis à jour.' }
  },
})
