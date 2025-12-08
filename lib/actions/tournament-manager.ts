/**
 * File: lib/actions/tournament-manager.ts
 * Description: Server actions for managing specific tournament details (Challonge, Registrations).
 * Author: Noé Henchoz
 * Date: 2025-12-07
 * License: MIT
 */

'use server'

// ----------------------------------------------------------------------
// IMPORTS
// ----------------------------------------------------------------------

import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
import { z } from 'zod'
import auth from '@/lib/auth'
import prisma from '@/lib/db/prisma'
import { RegistrationStatus, Role } from '@/prisma/generated/prisma/client'
import { APP_ROUTES } from '../config/routes'

// ----------------------------------------------------------------------
// TYPES & INTERFACES
// ----------------------------------------------------------------------

type ActionResponse = {
  success: boolean
  message: string
  errors?: Record<string, string[]>
}

// ----------------------------------------------------------------------
// CONSTANTS
// ----------------------------------------------------------------------

const updateChallongeIdSchema = z.object({
  challongeId: z.string().trim().optional().or(z.literal('')),
})

const updateRegistrationStatusSchema = z.object({
  registrationId: z.string().uuid(),
  status: z.nativeEnum(RegistrationStatus),
  tournamentId: z.string().uuid(),
})

const MESSAGES = {
  SUCCESS_CHALLONGE: 'Challonge ID updated successfully.',
  SUCCESS_DELETE: 'Registration deleted successfully.',
  SUCCESS_STATUS: 'Registration status updated successfully.',
  ERR_INVALID: 'Invalid input provided.',
  ERR_UPDATE: 'Failed to update Challonge ID.',
  ERR_DELETE: 'Failed to delete registration.',
  ERR_STATUS: 'Failed to update registration status.',
  ERR_UNAUTHORIZED: 'Unauthorized action.',
} as const

const FORM_KEYS = {
  CHALLONGE_ID: 'challongeId',
} as const

// ----------------------------------------------------------------------
// LOGIC
// ----------------------------------------------------------------------

export const updateChallongeId = async (
  tournamentId: string,
  _prevState: unknown,
  formData: FormData,
): Promise<ActionResponse> => {
  const rawData = {
    challongeId: formData.get(FORM_KEYS.CHALLONGE_ID),
  }

  const validation = updateChallongeIdSchema.safeParse(rawData)

  if (!validation.success) {
    return {
      success: false,
      message: MESSAGES.ERR_INVALID,
      errors: validation.error.flatten().fieldErrors,
    }
  }

  const challongeId = validation.data.challongeId || null

  try {
    await prisma.tournament.update({
      where: { id: tournamentId },
      data: { challongeId },
    })

    revalidatePath(`${APP_ROUTES.ADMIN_TOURNAMENTS}/${tournamentId}`)
    return { success: true, message: MESSAGES.SUCCESS_CHALLONGE }
  } catch (error) {
    console.error('Update Challonge ID Error:', error)
    return { success: false, message: MESSAGES.ERR_UPDATE }
  }
}

export const deleteRegistration = async (
  registrationId: string,
  tournamentId: string,
): Promise<ActionResponse> => {
  try {
    await prisma.registration.delete({
      where: { id: registrationId },
    })

    revalidatePath(`${APP_ROUTES.ADMIN_TOURNAMENTS}/${tournamentId}`)
    return { success: true, message: MESSAGES.SUCCESS_DELETE }
  } catch (error) {
    console.error('Delete Registration Error:', error)
    return { success: false, message: MESSAGES.ERR_DELETE }
  }
}

export const updateRegistrationStatus = async (
  registrationId: string,
  status: RegistrationStatus,
  tournamentId: string,
): Promise<ActionResponse> => {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (
    !session ||
    (session.user.role !== Role.ADMIN && session.user.role !== Role.SUPERADMIN)
  ) {
    return { success: false, message: MESSAGES.ERR_UNAUTHORIZED }
  }

  const validation = updateRegistrationStatusSchema.safeParse({
    registrationId,
    status,
    tournamentId,
  })

  if (!validation.success) {
    return {
      success: false,
      message: MESSAGES.ERR_INVALID,
      errors: validation.error.flatten().fieldErrors,
    }
  }

  try {
    await prisma.registration.update({
      where: { id: registrationId },
      data: { status },
    })

    revalidatePath(`${APP_ROUTES.ADMIN_TOURNAMENTS}/${tournamentId}`)
    return { success: true, message: MESSAGES.SUCCESS_STATUS }
  } catch (error) {
    console.error('Update Registration Status Error:', error)
    return { success: false, message: MESSAGES.ERR_STATUS }
  }
}
