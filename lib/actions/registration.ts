/**
 * File: lib/actions/registration.ts
 * Description: Server actions for handling tournament registrations (Public & Admin).
 */

'use server'

import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'

import { APP_ROUTES } from '@/lib/config/routes'
import auth from '@/lib/core/auth'
import prisma from '@/lib/core/db'
import {
  generateRegistrationEmailHtml,
  generateStatusUpdateEmailHtml,
  sendEmail,
} from '@/lib/core/email'
import { env } from '@/lib/core/env'
import { fr } from '@/lib/i18n/dictionaries/fr'
import * as RegistrationService from '@/lib/services/registration.service'
import { registrationSchema } from '@/lib/validations/registration'
import { RegistrationStatus, Role } from '@/prisma/generated/prisma/client'

// ----------------------------------------------------------------------
// TYPES
// ----------------------------------------------------------------------

export type RegistrationState = {
  success?: boolean
  errors?: {
    [key: string]: string[]
  }
  message?: string
}

type ActionResponse = {
  success: boolean
  message?: string
  error?: string
}

// ----------------------------------------------------------------------
// CONSTANTS
// ----------------------------------------------------------------------

const SUBJECT_MAP: Partial<Record<RegistrationStatus, string>> = {
  [RegistrationStatus.APPROVED]: 'Registration Approved',
  [RegistrationStatus.REJECTED]: 'Registration Rejected',
  [RegistrationStatus.WAITLIST]: 'Registration Status Update',
}

// ----------------------------------------------------------------------
// HELPERS
// ----------------------------------------------------------------------

/**
 * Helper to parse FormData with dot notation into a nested object.
 */
const parseFormData = (formData: FormData): Record<string, unknown> => {
  const object: Record<string, unknown> = {}

  for (const [key, value] of formData.entries()) {
    const keys = key.split('.')
    let current = object

    for (let i = 0; i < keys.length; i++) {
      const k = keys[i]
      const isLast = i === keys.length - 1

      if (isLast) {
        current[k] = value
      } else {
        const nextKey = keys[i + 1]
        const isNextArray = !Number.isNaN(Number(nextKey))

        if (!current[k]) {
          current[k] = isNextArray ? [] : {}
        }

        current = current[k] as Record<string, unknown>
      }
    }
  }

  // Ensure players is array
  if (
    object.players &&
    typeof object.players === 'object' &&
    !Array.isArray(object.players)
  ) {
    object.players = Object.values(object.players)
  }

  return object
}

async function ensureAdminAuth(): Promise<ActionResponse> {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (
    !session?.user ||
    (session.user.role !== Role.ADMIN && session.user.role !== Role.SUPERADMIN)
  ) {
    return {
      success: false,
      error: 'Unauthorized: Admin access required.',
    }
  }

  return { success: true }
}

async function processRegistrationUpdate(
  registrationId: string,
  newStatus: RegistrationStatus,
): Promise<ActionResponse> {
  const authCheck = await ensureAdminAuth()
  if (!authCheck.success) return authCheck

  if (!registrationId) {
    return { success: false, error: 'Registration ID is required.' }
  }

  try {
    const registration = await RegistrationService.updateRegistrationStatus(
      registrationId,
      newStatus,
    )

    const emailSubjectPrefix =
      SUBJECT_MAP[newStatus] ?? 'Registration Status Update'
    const emailHtml = generateStatusUpdateEmailHtml(
      registration.tournament.title,
      newStatus,
    )

    await sendEmail({
      to: registration.contactEmail,
      subject: `${emailSubjectPrefix} - ${registration.tournament.title}`,
      html: emailHtml,
    })

    revalidatePath(
      `${APP_ROUTES.ADMIN_TOURNAMENTS}/${registration.tournamentId}`,
    )

    return { success: true, message: `Status updated to ${newStatus}.` }
  } catch (error) {
    console.error(`Failed to update registration ${registrationId}:`, error)
    return { success: false, error: 'Internal server error during update.' }
  }
}

// ----------------------------------------------------------------------
// PUBLIC ACTIONS
// ----------------------------------------------------------------------

export const registerForTournament = async (
  _prevState: RegistrationState,
  formData: FormData,
): Promise<RegistrationState> => {
  const rawParsed = parseFormData(formData)

  // Pre-formatting for Zod
  const rawData: unknown = {
    ...rawParsed,
    players: Array.isArray(rawParsed.players)
      ? rawParsed.players.map(p => {
          const playerRecord = p as Record<string, unknown>
          return {
            ...playerRecord,
            data: playerRecord.data || {},
          }
        })
      : [],
  }

  const validation = registrationSchema.safeParse(rawData)

  if (!validation.success) {
    return {
      success: false,
      errors: validation.error.flatten().fieldErrors,
      message: fr.common.registration.validationError,
    }
  }

  const { tournamentId, contactEmail, players } = validation.data

  // 1. Fetch Tournament
  const tournamentData = await prisma.tournament.findUnique({
    include: { fields: true },
    where: { id: tournamentId },
  })

  if (!tournamentData) {
    return {
      success: false,
      message: fr.common.registration.tournamentNotFound,
    }
  }

  // Check Registration Window
  const now = new Date()
  if (
    now < tournamentData.registrationOpen ||
    now > tournamentData.registrationClose
  ) {
    return {
      success: false,
      message: fr.common.registration.registrationClosed,
    }
  }

  // 2. Check duplicates
  const existing =
    await RegistrationService.getRegistrationByEmailAndTournament(
      contactEmail,
      tournamentId,
    )
  if (existing) {
    return {
      success: false,
      message: fr.common.registration.emailAlreadyUsed,
    }
  }

  // Validate Dynamic Fields
  for (const player of players) {
    for (const field of tournamentData.fields) {
      const value = player.data[field.id]
      if (field.required && (!value || value.trim() === '')) {
        return {
          success: false,
          message: fr.common.registration.fieldMissing(
            field.label,
            player.nickname,
          ),
        }
      }
    }
  }

  // 3. Create Registration via Service
  try {
    const result = await RegistrationService.createRegistration(
      validation.data,
      tournamentData,
    )

    if (!result) throw new Error('Registration failed')

    const cancellationUrl = `${env.NEXT_PUBLIC_APP_URL}/cancel-registration?id=${result.id}&token=${result.cancellationToken}`

    const emailHtml = generateRegistrationEmailHtml(
      tournamentData.title,
      result.status,
      cancellationUrl,
    )

    await sendEmail({
      to: contactEmail,
      subject: `${fr.common.email.subjectPrefix}${tournamentData.title}`,
      html: emailHtml,
    })

    const message =
      result.status === RegistrationStatus.WAITLIST
        ? fr.common.registration.successWaitlist
        : fr.common.registration.successApproved

    revalidatePath(`${APP_ROUTES.TOURNAMENTS}/${tournamentData.slug}`)
    redirect(
      `${APP_ROUTES.TOURNAMENTS}/${tournamentData.slug}?success=true&message=${encodeURIComponent(
        message,
      )}`,
    )
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === fr.common.registration.emailAlreadyUsed
    ) {
      return {
        success: false,
        message: fr.common.registration.emailAlreadyUsed,
      }
    }
    console.error('Registration Error:', error)
    return {
      success: false,
      message: fr.common.errors.generic,
    }
  }
}

export const cancelRegistration = async (id: string, token: string) => {
  try {
    const registration = await RegistrationService.getRegistrationById(id)

    if (!registration) {
      return { success: false, message: fr.common.registration.cancelNotFound }
    }

    if (registration.cancellationToken !== token) {
      return {
        success: false,
        message: fr.common.registration.cancelInvalidToken,
      }
    }

    await RegistrationService.deleteRegistration(id)

    revalidatePath(`${APP_ROUTES.TOURNAMENTS}/${registration.tournament.slug}`)
    return {
      success: true,
      message: fr.common.registration.cancelSuccess,
    }
  } catch (error) {
    console.error('Cancellation Error:', error)
    return { success: false, message: fr.common.registration.cancelFailed }
  }
}

// ----------------------------------------------------------------------
// ADMIN ACTIONS
// ----------------------------------------------------------------------

export async function updateRegistrationStatus(
  registrationId: string,
  newStatus: RegistrationStatus,
) {
  return processRegistrationUpdate(registrationId, newStatus)
}

export async function approveRegistration(registrationId: string) {
  return processRegistrationUpdate(registrationId, RegistrationStatus.APPROVED)
}

export async function rejectRegistration(registrationId: string) {
  return processRegistrationUpdate(registrationId, RegistrationStatus.REJECTED)
}

export async function moveToWaitlist(registrationId: string) {
  return processRegistrationUpdate(registrationId, RegistrationStatus.WAITLIST)
}

export const deleteRegistration = async (
  registrationId: string,
  tournamentId: string,
): Promise<ActionResponse> => {
  // Check Admin
  const authCheck = await ensureAdminAuth()
  if (!authCheck.success) return authCheck

  try {
    await RegistrationService.deleteRegistration(registrationId)
    revalidatePath(`${APP_ROUTES.ADMIN_TOURNAMENTS}/${tournamentId}`)
    return { success: true, message: 'Registration deleted successfully.' }
  } catch (error) {
    console.error('Delete Registration Error:', error)
    return { success: false, error: 'Failed to delete registration.' }
  }
}
