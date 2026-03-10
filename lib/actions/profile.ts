/**
 * File: lib/actions/profile.ts
 * Description: Server action for updating user profile (displayName).
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

'use server'

import { authenticatedAction } from '@/lib/actions/safe-action'
import prisma from '@/lib/core/prisma'
import type { ActionState } from '@/lib/types/actions'
import { profileSchema } from '@/lib/validations/profile'

export const updateProfile = authenticatedAction({
  schema: profileSchema,
  handler: async (data, session): Promise<ActionState> => {
    await prisma.user.update({
      where: { id: session.user.id },
      data: { displayName: data.displayName },
    })

    return { success: true, message: 'Votre nom a été mis à jour.' }
  },
})
