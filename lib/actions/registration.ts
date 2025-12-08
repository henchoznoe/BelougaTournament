/**
 * File: lib/actions/registration.ts
 * Description: Server actions for handling tournament registrations.
 * Author: Noé Henchoz
 * Date: 2025-12-07
 * License: MIT
 */

'use server'

// ----------------------------------------------------------------------
// IMPORTS
// ----------------------------------------------------------------------

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'

import prisma from '@/lib/db/prisma'
import { generateRegistrationEmailHtml, sendEmail } from '@/lib/email'
import { env } from '@/lib/env'
import { Prisma, type Registration } from '@/prisma/generated/prisma/client'
import type { RegistrationStatus } from '@/prisma/generated/prisma/enums'
import { APP_ROUTES } from '../config/routes'
import { fr } from '../i18n/dictionaries/fr'

// ----------------------------------------------------------------------
// TYPES & INTERFACES
// ----------------------------------------------------------------------

type FormFieldValue = string | string[] | Record<string, unknown>

interface ParsedFormData {
  [key: string]: FormFieldValue | ParsedFormData | ParsedFormData[]
}

export type RegistrationState = {
  success?: boolean
  errors?: {
    [key: string]: string[]
  }
  message?: string
}

// ----------------------------------------------------------------------
// CONSTANTS
// ----------------------------------------------------------------------

// CONTENT constant removed in favor of fr dictionary

const BASE_REGISTRATION_SCHEMA = z.object({
  contactEmail: z.string().email(fr.common.server.validations.emailInvalid),
  players: z
    .array(
      z.object({
        data: z.record(z.string(), z.string()), // fieldId -> value
        nickname: z
          .string()
          .min(1, fr.common.server.validations.nicknameRequired),
      }),
    )
    .min(1, fr.common.server.validations.playersMin),
  teamName: z.string().optional(),
  tournamentId: z.string().uuid(),
})

// ----------------------------------------------------------------------
// LOGIC
// ----------------------------------------------------------------------

/**
 * Helper to parse FormData with dot notation into a nested object.
 * Replaces the previous `any` based implementation with a recursive one.
 */
const parseFormData = (formData: FormData): ParsedFormData => {
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

        // Narrowing type for recursion
        current = current[k] as Record<string, unknown>
      }
    }
  }

  // Handle conversion of object-like arrays (numeric keys) to actual arrays if needed
  // Note: The loop above initializes arrays correctly if keys are numeric ('0', '1'...).
  // We double check 'players' specifically to ensure it is an array as expected by schema.
  if (
    object.players &&
    typeof object.players === 'object' &&
    !Array.isArray(object.players)
  ) {
    object.players = Object.values(object.players)
  }

  return object as unknown as ParsedFormData
}

export const registerForTournament = async (
  _prevState: RegistrationState,
  formData: FormData,
): Promise<RegistrationState> => {
  const rawParsed = parseFormData(formData)

  // Ensure strict typing for the raw data before Zod parsing
  // This step bridges the untyped FormData world to our Zod schema
  // We use `unknown` cast first to avoid `any` in a safe way b/c we validate right after.
  const rawData: unknown = {
    ...rawParsed,
    // Ensure players map has the correct structure for data
    players: Array.isArray(rawParsed.players)
      ? rawParsed.players.map(p => {
          // Manually cast p to a shape similar to RawPlayer to interact with properties safely
          // or at least unknown/Record to check 'data'
          const playerRecord = p as Record<string, unknown>
          return {
            ...playerRecord,
            data: playerRecord.data || {},
          }
        })
      : [],
  }

  console.log('[Registration] Raw Data:', JSON.stringify(rawData, null, 2))

  const validation = BASE_REGISTRATION_SCHEMA.safeParse(rawData)

  if (!validation.success) {
    return {
      success: false,
      errors: validation.error.flatten().fieldErrors,
      message: fr.common.registration.validationError,
    }
  }

  console.log('[Registration] Validation passed')

  const { tournamentId, teamName, contactEmail, players } = validation.data

  // 1. Fetch Tournament and Fields to validate constraints
  const tournament = await prisma.tournament.findUnique({
    include: { fields: true },
    where: { id: tournamentId },
  })

  if (!tournament) {
    return {
      success: false,
      message: fr.common.registration.tournamentNotFound,
    }
  }

  // Check if registration is open
  const now = new Date()
  if (now < tournament.registrationOpen || now > tournament.registrationClose) {
    return {
      success: false,
      message: fr.common.registration.registrationClosed,
    }
  }

  // 2. Check for duplicates
  const existingRegistration = await prisma.registration.findUnique({
    where: {
      tournamentId_contactEmail: {
        tournamentId,
        contactEmail,
      },
    },
  })

  if (existingRegistration) {
    return {
      success: false,
      message: fr.common.registration.emailAlreadyUsed,
    }
  }

  // Validate Dynamic Fields for each player
  for (const player of players) {
    for (const field of tournament.fields) {
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

  let registrationResult: Registration | null = null

  try {
    registrationResult = await prisma.$transaction(async tx => {
      // 3. Max Participants Logic
      let status: RegistrationStatus = 'PENDING'

      if (tournament.maxParticipants) {
        // Lock the Tournament row to prevent race conditions
        await tx.$executeRaw`SELECT * FROM "Tournament" WHERE id = ${tournamentId} FOR UPDATE`

        const currentRegistrations = await tx.registration.count({
          where: {
            tournamentId,
            status: { not: 'REJECTED' },
          },
        })

        if (currentRegistrations >= tournament.maxParticipants) {
          status = 'WAITLIST'
        } else if (tournament.autoApprove) {
          status = 'APPROVED'
        } else {
          status = 'PENDING'
        }
      } else if (tournament.autoApprove) {
        status = 'APPROVED'
      }

      // Create Registration
      const registration = await tx.registration.create({
        data: {
          contactEmail,
          status,
          teamName: tournament.format === 'TEAM' ? teamName : undefined,
          tournamentId,
        },
      })

      // Create Players and Data - Parallel Execution
      await Promise.all(
        players.map(async player => {
          const createdPlayer = await tx.player.create({
            data: {
              nickname: player.nickname,
              registrationId: registration.id,
            },
          })

          const dataEntries = Object.entries(player.data).map(
            ([fieldId, value]) => ({
              playerId: createdPlayer.id,
              tournamentFieldId: fieldId,
              value: value,
            }),
          )

          if (dataEntries.length > 0) {
            await tx.playerData.createMany({
              data: dataEntries,
            })
          }
        }),
      )
      return registration
    })
  } catch (error) {
    console.error('Registration Error:', error)
    if (error instanceof Error) {
      if (error.message === 'Tournament is full.') {
        return {
          success: false,
          message: fr.common.registration.tournamentFull,
        }
      }
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return {
          success: false,
          message: fr.common.registration.emailAlreadyUsed,
        }
      }
    }

    return {
      success: false,
      message: fr.common.errors.generic,
    }
  }

  if (!registrationResult) {
    return { success: false, message: fr.common.registration.failed }
  }

  const cancellationUrl = `${env.NEXT_PUBLIC_APP_URL}/cancel-registration?id=${registrationResult.id}&token=${registrationResult.cancellationToken}`

  // Send Confirmation Email
  const emailHtml = generateRegistrationEmailHtml(
    tournament.title,
    registrationResult.status,
    cancellationUrl,
  )

  await sendEmail({
    to: contactEmail,
    subject: `${fr.common.email.subjectPrefix}${tournament.title}`,
    html: emailHtml,
  })

  const message =
    registrationResult.status === 'WAITLIST'
      ? fr.common.registration.successWaitlist
      : fr.common.registration.successApproved

  revalidatePath(`${APP_ROUTES.TOURNAMENTS}/${tournament.slug}`)
  redirect(
    `${APP_ROUTES.TOURNAMENTS}/${tournament.slug}?success=true&message=${encodeURIComponent(
      message,
    )}`,
  )
}

export const cancelRegistration = async (id: string, token: string) => {
  try {
    const registration = await prisma.registration.findUnique({
      where: { id },
      include: { tournament: true },
    })

    if (!registration) {
      return { success: false, message: fr.common.registration.cancelNotFound }
    }

    if (registration.cancellationToken !== token) {
      return {
        success: false,
        message: fr.common.registration.cancelInvalidToken,
      }
    }

    await prisma.registration.delete({
      where: { id },
    })

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
