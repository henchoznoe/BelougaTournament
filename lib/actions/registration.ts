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

const CONTENT = {
  VALIDATION_ERROR: 'Veuillez corriger les erreurs dans le formulaire.',
  TOURNAMENT_NOT_FOUND: 'Tournoi introuvable.',
  REGISTRATION_CLOSED: 'Les inscriptions sont fermées.',
  EMAIL_ALREADY_USED: 'Cet email est déjà utilisé pour ce tournoi.',
  REQUIRED_FIELD_MISSING: (label: string, nickname: string) =>
    `Champ requis manquant : ${label} pour le joueur ${nickname}`,
  TOURNAMENT_FULL: 'Le tournoi est complet.',
  GENERIC_ERROR:
    "Une erreur est survenue lors de l'inscription. Veuillez réessayer.",
  REGISTRATION_FAILED: "Échec de l'inscription.",
  SUCCESS_WAITLIST:
    "Inscription réussie ! Vous avez été placé sur la liste d'attente.",
  SUCCESS_APPROVED: 'Inscription réussie !',
  CANCEL_NOT_FOUND: 'Inscription introuvable.',
  CANCEL_INVALID_TOKEN: "Jeton d'annulation invalide.",
  CANCEL_SUCCESS: 'Inscription annulée avec succès.',
  CANCEL_FAILED: "Échec de l'annulation de l'inscription.",
  EMAIL_SUBJECT_PREFIX: 'Inscription reçue - ',
  LOGS: {
    RAW_DATA: '[Registration] Raw Data:',
    VALIDATION_PASSED: '[Registration] Validation passed',
    ERROR_REGISTRATION: 'Registration Error:',
    ERROR_CANCELLATION: 'Cancellation Error:',
  },
} as const

const BASE_REGISTRATION_SCHEMA = z.object({
  contactEmail: z.string().email(),
  players: z
    .array(
      z.object({
        data: z.record(z.string(), z.string()), // fieldId -> value
        nickname: z.string().min(1, 'Le pseudo est requis'),
      }),
    )
    .min(1, 'Au moins un joueur est requis'),
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

  console.log(CONTENT.LOGS.RAW_DATA, JSON.stringify(rawData, null, 2))

  const validation = BASE_REGISTRATION_SCHEMA.safeParse(rawData)

  if (!validation.success) {
    return {
      success: false,
      errors: validation.error.flatten().fieldErrors,
      message: CONTENT.VALIDATION_ERROR,
    }
  }

  console.log(CONTENT.LOGS.VALIDATION_PASSED)

  const { tournamentId, teamName, contactEmail, players } = validation.data

  // 1. Fetch Tournament and Fields to validate constraints
  const tournament = await prisma.tournament.findUnique({
    include: { fields: true },
    where: { id: tournamentId },
  })

  if (!tournament) {
    return { success: false, message: CONTENT.TOURNAMENT_NOT_FOUND }
  }

  // Check if registration is open
  const now = new Date()
  if (now < tournament.registrationOpen || now > tournament.registrationClose) {
    return { success: false, message: CONTENT.REGISTRATION_CLOSED }
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
      message: CONTENT.EMAIL_ALREADY_USED,
    }
  }

  // Validate Dynamic Fields for each player
  for (const player of players) {
    for (const field of tournament.fields) {
      const value = player.data[field.id]

      if (field.required && (!value || value.trim() === '')) {
        return {
          success: false,
          message: CONTENT.REQUIRED_FIELD_MISSING(field.label, player.nickname),
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
    console.error(CONTENT.LOGS.ERROR_REGISTRATION, error)
    if (error instanceof Error) {
      if (error.message === 'Tournament is full.') {
        return { success: false, message: CONTENT.TOURNAMENT_FULL }
      }
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return {
          success: false,
          message: CONTENT.EMAIL_ALREADY_USED,
        }
      }
    }

    return {
      success: false,
      message: CONTENT.GENERIC_ERROR,
    }
  }

  if (!registrationResult) {
    return { success: false, message: CONTENT.REGISTRATION_FAILED }
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
    subject: `${CONTENT.EMAIL_SUBJECT_PREFIX}${tournament.title}`,
    html: emailHtml,
  })

  const message =
    registrationResult.status === 'WAITLIST'
      ? CONTENT.SUCCESS_WAITLIST
      : CONTENT.SUCCESS_APPROVED

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
      return { success: false, message: CONTENT.CANCEL_NOT_FOUND }
    }

    if (registration.cancellationToken !== token) {
      return { success: false, message: CONTENT.CANCEL_INVALID_TOKEN }
    }

    await prisma.registration.delete({
      where: { id },
    })

    revalidatePath(`${APP_ROUTES.TOURNAMENTS}/${registration.tournament.slug}`)
    return {
      success: true,
      message: CONTENT.CANCEL_SUCCESS,
    }
  } catch (error) {
    console.error(CONTENT.LOGS.ERROR_CANCELLATION, error)
    return { success: false, message: CONTENT.CANCEL_FAILED }
  }
}
