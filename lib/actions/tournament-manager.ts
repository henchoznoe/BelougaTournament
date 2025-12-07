/**
 * File: lib/actions/tournament-manager.ts
 * Description: Server actions for managing specific tournament details (Challonge, Registrations).
 * Author: Noé Henchoz
 * Date: 2025-12-02
 * License: MIT
 */

'use server'

// ----------------------------------------------------------------------
// IMPORTS
// ----------------------------------------------------------------------

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import prisma from '@/lib/db/prisma'

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

const MESSAGES = {
  SUCCESS_CHALLONGE: 'Challonge ID updated successfully.',
  SUCCESS_DELETE: 'Registration deleted successfully.',
  ERR_INVALID: 'Invalid input provided.',
  ERR_UPDATE: 'Failed to update Challonge ID.',
  ERR_DELETE: 'Failed to delete registration.',
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

    revalidatePath(`/admin/tournaments/${tournamentId}`)
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

    revalidatePath(`/admin/tournaments/${tournamentId}`)
    return { success: true, message: MESSAGES.SUCCESS_DELETE }
  } catch (error) {
    console.error('Delete Registration Error:', error)
    return { success: false, message: MESSAGES.ERR_DELETE }
  }
}
