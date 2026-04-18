/**
 * File: lib/actions/sponsors.ts
 * Description: Server actions for sponsor CRUD operations.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

'use server'

import { revalidateTag } from 'next/cache'
import { authenticatedAction } from '@/lib/actions/safe-action'
import { CACHE_TAGS, NOON_UTC_SUFFIX } from '@/lib/config/constants'
import prisma from '@/lib/core/prisma'
import type { ActionState } from '@/lib/types/actions'
import { toNullable } from '@/lib/utils/formatting'
import {
  deleteSponsorSchema,
  sponsorSchema,
  toggleSponsorStatusSchema,
  updateSponsorSchema,
} from '@/lib/validations/sponsors'
import { Role } from '@/prisma/generated/prisma/enums'

export const createSponsor = authenticatedAction({
  schema: sponsorSchema,
  role: Role.ADMIN,
  handler: async (data): Promise<ActionState> => {
    await prisma.sponsor.create({
      data: {
        name: data.name,
        imageUrls: data.imageUrls,
        url: toNullable(data.url),
        supportedSince: new Date(`${data.supportedSince}${NOON_UTC_SUFFIX}`),
      },
    })

    revalidateTag(CACHE_TAGS.SPONSORS, 'hours')

    return { success: true, message: 'Le sponsor a été créé.' }
  },
})

export const updateSponsor = authenticatedAction({
  schema: updateSponsorSchema,
  role: Role.ADMIN,
  handler: async (data): Promise<ActionState> => {
    await prisma.sponsor.update({
      where: { id: data.id },
      data: {
        name: data.name,
        imageUrls: data.imageUrls,
        url: toNullable(data.url),
        supportedSince: new Date(`${data.supportedSince}${NOON_UTC_SUFFIX}`),
      },
    })

    revalidateTag(CACHE_TAGS.SPONSORS, 'hours')

    return { success: true, message: 'Le sponsor a été mis à jour.' }
  },
})

export const deleteSponsor = authenticatedAction({
  schema: deleteSponsorSchema,
  role: Role.ADMIN,
  handler: async (data): Promise<ActionState> => {
    await prisma.sponsor.delete({
      where: { id: data.id },
    })

    revalidateTag(CACHE_TAGS.SPONSORS, 'hours')

    return { success: true, message: 'Le sponsor a été supprimé.' }
  },
})

export const toggleSponsorStatus = authenticatedAction({
  schema: toggleSponsorStatusSchema,
  role: Role.ADMIN,
  handler: async (data): Promise<ActionState> => {
    const sponsor = await prisma.sponsor.findUnique({
      where: { id: data.id },
      select: { enabled: true },
    })

    if (!sponsor) {
      return { success: false, message: 'Sponsor introuvable.' }
    }

    await prisma.sponsor.update({
      where: { id: data.id },
      data: { enabled: !sponsor.enabled },
    })

    revalidateTag(CACHE_TAGS.SPONSORS, 'hours')

    const statusLabel = sponsor.enabled ? 'désactivé' : 'activé'
    return { success: true, message: `Le sponsor a été ${statusLabel}.` }
  },
})
