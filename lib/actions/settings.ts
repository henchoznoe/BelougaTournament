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
    await prisma.globalSettings.upsert({
      where: { id: 1 },
      update: {
        logoUrl: toNullable(data.logoUrl),
        twitchUsername: toNullable(data.twitchUsername),
        twitchUrl: toNullable(data.twitchUrl),
        discordUrl: toNullable(data.discordUrl),
        instagramUrl: toNullable(data.instagramUrl),
        tiktokUrl: toNullable(data.tiktokUrl),
        youtubeUrl: toNullable(data.youtubeUrl),
      },
      create: {
        id: 1,
        logoUrl: toNullable(data.logoUrl),
        twitchUsername: toNullable(data.twitchUsername),
        twitchUrl: toNullable(data.twitchUrl),
        discordUrl: toNullable(data.discordUrl),
        instagramUrl: toNullable(data.instagramUrl),
        tiktokUrl: toNullable(data.tiktokUrl),
        youtubeUrl: toNullable(data.youtubeUrl),
      },
    })

    revalidateTag('settings', 'hours')

    return { success: true, message: 'Les paramètres ont été mis à jour.' }
  },
})
