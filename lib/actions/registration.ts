/**
 * File: lib/actions/registration.ts
 * Description: Server actions for handling tournament registrations.
 * Author: Noé Henchoz
 * Date: 2025-12-02
 * License: MIT
 */

'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { generateRegistrationEmailHtml, sendEmail } from '@/lib/email'
import { env } from '@/lib/env'
import prisma from '@/lib/prisma'
import { Prisma, type Registration } from '@/prisma/generated/prisma/client'
import type { RegistrationStatus } from '@/prisma/generated/prisma/enums'

const baseRegistrationSchema = z.object({
  contactEmail: z.string().email(),
  players: z
    .array(
      z.object({
        data: z.record(z.string(), z.string()), // fieldId -> value
        nickname: z.string().min(1, 'Nickname is required'),
      }),
    )
    .min(1, 'At least one player is required'),
  teamName: z.string().optional(),
  tournamentId: z.string().uuid(),
})

export type RegistrationState = {
  success?: boolean
  errors?: {
    [key: string]: string[]
  }
  message?: string
}

// Helper to parse FormData with dot notation
function parseFormData(formData: FormData) {
  // biome-ignore lint/suspicious/noExplicitAny: Dynamic object construction from FormData
  const object: any = {}
  for (const [key, value] of formData.entries()) {
    const keys = key.split('.')
    let current = object
    for (let i = 0; i < keys.length; i++) {
      const k = keys[i]
      if (i === keys.length - 1) {
        current[k] = value
      } else {
        // If the next key is a number, it's an array
        if (!Number.isNaN(Number(keys[i + 1]))) {
          current[k] = current[k] || []
          // Ensure it's an array before pushing
          if (!Array.isArray(current[k])) {
            current[k] = []
          }
        } else {
          current[k] = current[k] || {}
        }
        current = current[k]
      }
    }
  }

  // Convert players object to array if it is an object with numeric keys
  // This is handled by the recursive parsing logic above if keys are like players.0.nickname
  // but if the form structure is different, this might be needed.
  // For now, assuming players.0.nickname structure, the above logic should create an array.
  // If players is an object with numeric keys (e.g., { '0': { ... }, '1': { ... } }),
  // Object.values will convert it to an array.
  if (
    object.players &&
    typeof object.players === 'object' &&
    !Array.isArray(object.players)
  ) {
    object.players = Object.values(object.players)
  }
  return object
}

export async function registerForTournament(
  _prevState: RegistrationState,
  formData: FormData,
): Promise<RegistrationState> {
  const rawData = parseFormData(formData)

  // Ensure players structure is correct for Zod
  if (rawData.players && Array.isArray(rawData.players)) {
    // biome-ignore lint/suspicious/noExplicitAny: Mapping raw player data
    rawData.players = rawData.players.map((p: any) => ({
      ...p,
      data: p.data || {}, // Ensure data object exists
    }))
  }

  const validation = baseRegistrationSchema.safeParse(rawData)

  if (!validation.success) {
    return {
      success: false,
      errors: validation.error.flatten().fieldErrors,
      message: 'Veuillez corriger les erreurs dans le formulaire.',
    }
  }

  const { tournamentId, teamName, contactEmail, players } = validation.data

  // 1. Fetch Tournament and Fields to validate constraints
  const tournament = await prisma.tournament.findUnique({
    include: { fields: true },
    where: { id: tournamentId },
  })

  if (!tournament) {
    return { success: false, message: 'Tournoi introuvable.' }
  }

  // Check if registration is open
  const now = new Date()
  if (now < tournament.registrationOpen || now > tournament.registrationClose) {
    return { success: false, message: 'Les inscriptions sont fermées.' }
  }

  // 2. Check for duplicates
  // We check if the contactEmail is already used for this tournament.
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
      message: 'Cet email est déjà utilisé pour ce tournoi.',
    }
  }

  // Validate Dynamic Fields for each player
  for (const player of players) {
    for (const field of tournament.fields) {
      const value = player.data[field.id]

      if (field.required && (!value || value.trim() === '')) {
        return {
          success: false,
          message: `Champ requis manquant : ${field.label} pour le joueur ${player.nickname}`,
        }
      }
    }
  }

  let finalStatus: RegistrationStatus = 'PENDING'
  let registrationResult: Registration | null = null

  try {
    registrationResult = await prisma.$transaction(async tx => {
      // 3. Max Participants Logic
      // maxParticipants refers to the number of "Registration Slots".
      // - For TEAM format: 1 Registration = 1 Team
      // - For SOLO format: 1 Registration = 1 Player (or 1 Entry)
      let status: RegistrationStatus = 'PENDING'

      if (tournament.maxParticipants) {
        // Lock the Tournament row to prevent race conditions
        // We cast ID to string to ensure safety, though it's already UUID
        await tx.$executeRaw`SELECT * FROM "Tournament" WHERE id = ${tournamentId} FOR UPDATE`

        // lock acquired, safe to count
        const currentRegistrations = await tx.registration.count({
          where: { tournamentId },
        })

        if (currentRegistrations >= tournament.maxParticipants) {
          status = 'WAITLIST'
        } else if (tournament.autoApprove) {
          status = 'APPROVED'
        } else {
          status = 'PENDING'
        }
      } else if (tournament.autoApprove) {
        // If no max limit is set, but autoApprove is on, approve.
        status = 'APPROVED'
      }

      finalStatus = status

      // Create Registration
      const registration = await tx.registration.create({
        data: {
          contactEmail,
          status,
          teamName: tournament.format === 'TEAM' ? teamName : undefined,
          tournamentId,
        },
      })

      // Create Players and Data
      // Create Players and Data - Parallel Execution
      await Promise.all(
        players.map(async player => {
          const createdPlayer = await tx.player.create({
            data: {
              nickname: player.nickname,
              registrationId: registration.id,
            },
          })

          // Create PlayerData
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
        return { success: false, message: 'Le tournoi est complet.' }
      }
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if ((error as Prisma.PrismaClientKnownRequestError).code === 'P2002') {
        return {
          success: false,
          message: 'Cet email est déjà utilisé pour ce tournoi.',
        }
      }
    }

    return {
      success: false,
      message:
        "Une erreur est survenue lors de l'inscription. Veuillez réessayer.",
    }
  }

  if (!registrationResult) {
    return { success: false, message: "Échec de l'inscription." }
  }

  const cancellationUrl = `${env.NEXT_PUBLIC_APP_URL}/cancel-registration?id=${registrationResult.id}&token=${registrationResult.cancellationToken}`

  // Send Confirmation Email
  const emailHtml = generateRegistrationEmailHtml(
    tournament.title,
    finalStatus,
    cancellationUrl,
  )

  await sendEmail({
    to: contactEmail,
    subject: `Inscription reçue - ${tournament.title}`,
    html: emailHtml,
  })

  const message =
    (finalStatus as RegistrationStatus) === 'WAITLIST'
      ? "Inscription réussie ! Vous avez été placé sur la liste d'attente."
      : 'Inscription réussie !'

  revalidatePath(`/tournaments/${tournament.slug}`)
  // Using redirect here as it's the most reliable way to reset form and show success page
  redirect(
    `/tournaments/${tournament.slug}?success=true&message=${encodeURIComponent(message)}`,
  )
}

export async function cancelRegistration(id: string, token: string) {
  try {
    const registration = await prisma.registration.findUnique({
      where: { id },
      include: { tournament: true },
    })

    if (!registration) {
      return { success: false, message: 'Registration not found.' }
    }

    if (registration.cancellationToken !== token) {
      return { success: false, message: 'Invalid cancellation token.' }
    }

    await prisma.registration.delete({
      where: { id },
    })

    revalidatePath(`/tournaments/${registration.tournament.slug}`)
    return {
      success: true,
      message: 'Registration cancelled successfully.',
    }
  } catch (error) {
    console.error('Cancellation Error:', error)
    return { success: false, message: 'Failed to cancel registration.' }
  }
}
