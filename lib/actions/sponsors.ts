/**
 * File: lib/actions/sponsors.ts
 * Description: Server actions for sponsor CRUD operations (SUPERADMIN only).
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

'use server'

import { revalidateTag } from 'next/cache'
import { authenticatedAction } from '@/lib/actions/safe-action'
import prisma from '@/lib/core/prisma'
import type { ActionState } from '@/lib/types/actions'
import {
  deleteSponsorSchema,
  sponsorSchema,
  updateSponsorSchema,
} from '@/lib/validations/sponsors'
import { Role } from '@/prisma/generated/prisma/enums'

/** Converts empty strings to null for nullable Prisma fields. */
const toNullable = (val: string): string | null => val || null

export const createSponsor = authenticatedAction({
  schema: sponsorSchema,
  role: Role.SUPERADMIN,
  handler: async (data): Promise<ActionState> => {
    await prisma.sponsor.create({
      data: {
        name: data.name,
        imageUrls: data.imageUrls,
        url: toNullable(data.url),
        order: data.order,
      },
    })

    revalidateTag('sponsors', 'hours')

    return { success: true, message: 'Le sponsor a été créé.' }
  },
})

export const updateSponsor = authenticatedAction({
  schema: updateSponsorSchema,
  role: Role.SUPERADMIN,
  handler: async (data): Promise<ActionState> => {
    await prisma.sponsor.update({
      where: { id: data.id },
      data: {
        name: data.name,
        imageUrls: data.imageUrls,
        url: toNullable(data.url),
        order: data.order,
      },
    })

    revalidateTag('sponsors', 'hours')

    return { success: true, message: 'Le sponsor a été mis à jour.' }
  },
})

export const deleteSponsor = authenticatedAction({
  schema: deleteSponsorSchema,
  role: Role.SUPERADMIN,
  handler: async (data): Promise<ActionState> => {
    await prisma.sponsor.delete({
      where: { id: data.id },
    })

    revalidateTag('sponsors', 'hours')

    return { success: true, message: 'Le sponsor a été supprimé.' }
  },
})
