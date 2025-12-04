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
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'

// We can't statically define the schema here because it depends on the tournament fields.
// We will validate the structure of the incoming data, and then validate the dynamic fields against the DB.

const baseRegistrationSchema = z.object({
    contactEmail: z.string().email(),
    players: z
        .array(
            z.object({
                data: z.record(z.string(), z.string()), // fieldId -> value
                isCaptain: z.boolean().default(false),
                nickname: z.string().min(1, 'Nickname is required'),
            }),
        )
        .min(1, 'At least one player is required'),
    teamName: z.string().optional(),
    tournamentId: z.string().uuid(),
})

export type RegistrationState = {
    errors?: {
        [key: string]: string[]
    }
    message?: string
}

export async function registerForTournament(
    data: z.infer<typeof baseRegistrationSchema>,
) {
    const validation = baseRegistrationSchema.safeParse(data)

    if (!validation.success) {
        return {
            errors: validation.error.flatten().fieldErrors,
            message: 'Invalid submission data.',
        }
    }

    const { tournamentId, teamName, contactEmail, players } = validation.data

    // 1. Fetch Tournament and Fields to validate constraints
    const tournament = await prisma.tournament.findUnique({
        include: { fields: true },
        where: { id: tournamentId },
    })

    if (!tournament) {
        return { message: 'Tournament not found.' }
    }

    // Check if registration is open
    const now = new Date()
    if (
        now < tournament.registrationOpen ||
        now > tournament.registrationClose
    ) {
        return { message: 'Registration is closed.' }
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
        return { message: 'Email already used for this tournament.' }
    }

    // Validate Dynamic Fields for each player
    for (const player of players) {
        for (const field of tournament.fields) {
            const value = player.data[field.id]

            if (field.required && (!value || value.trim() === '')) {
                return {
                    message: `Missing required field: ${field.label} for player ${player.nickname}`,
                }
            }
        }
    }

    try {
        await prisma.$transaction(async tx => {
            // 3. Max Participants Logic
            // maxParticipants refers to the number of "Registration Slots".
            // - For TEAM format: 1 Registration = 1 Team
            // - For SOLO format: 1 Registration = 1 Player (or 1 Entry)
            let status: 'PENDING' | 'APPROVED' = 'PENDING'

            if (tournament.maxParticipants) {
                // Lock the table or rows if necessary, but here we rely on the transaction isolation
                // to ensure the count is accurate at the moment of check.
                const currentRegistrations = await tx.registration.count({
                    where: { tournamentId },
                })

                if (currentRegistrations >= tournament.maxParticipants) {
                    throw new Error('Tournament is full.')
                }

                // 4. Auto-Approve Logic
                // If autoApprove is enabled and we are within limits, approve immediately.
                if (tournament.autoApprove) {
                    status = 'APPROVED'
                }
            } else if (tournament.autoApprove) {
                // If no max limit is set, but autoApprove is on, approve.
                status = 'APPROVED'
            }

            // Create Registration
            const registration = await tx.registration.create({
                data: {
                    contactEmail,
                    status,
                    teamName:
                        tournament.format === 'TEAM' ? teamName : undefined,
                    tournamentId,
                },
            })

            // Create Players and Data
            for (const player of players) {
                const createdPlayer = await tx.player.create({
                    data: {
                        isCaptain: player.isCaptain,
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
            }
        })
    } catch (error) {
        console.error('Registration Error:', error)
        if (error instanceof Error) {
            if (error.message === 'Tournament is full.') {
                return { message: 'Tournament is full.' }
            }
        }

        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === 'P2002') {
                return { message: 'Email already used for this tournament.' }
            }
        }

        return { message: 'Failed to process registration. Please try again.' }
    }

    revalidatePath(`/tournaments/${tournament.slug}`)
    redirect(`/tournaments/${tournament.slug}?success=true`)
}
