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

    let finalStatus: RegistrationStatus = 'PENDING'
    let registration: Registration | null = null

    try {
        registration = await prisma.$transaction(async tx => {
            // 3. Max Participants Logic
            // maxParticipants refers to the number of "Registration Slots".
            // - For TEAM format: 1 Registration = 1 Team
            // - For SOLO format: 1 Registration = 1 Player (or 1 Entry)
            let status: RegistrationStatus = 'PENDING'

            if (tournament.maxParticipants) {
                // Lock the table or rows if necessary, but here we rely on the transaction isolation
                // to ensure the count is accurate at the moment of check.
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
                    teamName:
                        tournament.format === 'TEAM' ? teamName : undefined,
                    tournamentId,
                },
            })

            // Create Players and Data
            for (const player of players) {
                const createdPlayer = await tx.player.create({
                    data: {
                        // isCaptain removed from schema in previous turn, check if it still exists in types?
                        // If schema was updated, we should check if isCaptain is still in PlayerCreateInput
                        // Assuming it was removed based on previous conversation summary, but let's check.
                        // Wait, the previous conversation said "Remove isCaptain boolean field".
                        // So I should remove it here too if it causes error.
                        // But I see it in the code I read earlier: "isCaptain: player.isCaptain,"
                        // Let's keep it for now, if it errors I'll fix it.
                        // Actually, the lint error said: "Object literal may only specify known properties, and 'isCaptain' does not exist"
                        // So I MUST remove it.
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
            return registration
        })
    } catch (error) {
        console.error('Registration Error:', error)
        if (error instanceof Error) {
            if (error.message === 'Tournament is full.') {
                return { message: 'Tournament is full.' }
            }
        }

        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (
                (error as Prisma.PrismaClientKnownRequestError).code === 'P2002'
            ) {
                return { message: 'Email already used for this tournament.' }
            }
        }

        return { message: 'Failed to process registration. Please try again.' }
    }

    if (!registration) {
        return { message: 'Failed to process registration.' }
    }

    const cancellationUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/cancel-registration?id=${registration.id}&token=${registration.cancellationToken}`

    // Send Confirmation Email
    const emailHtml = generateRegistrationEmailHtml(
        tournament.title,
        finalStatus,
        cancellationUrl,
    )

    await sendEmail({
        to: contactEmail,
        subject: `Registration Received - ${tournament.title}`,
        html: emailHtml,
    })

    const message =
        (finalStatus as RegistrationStatus) === 'WAITLIST'
            ? 'Registration successful! You have been placed on the waitlist.'
            : 'Registration successful!'

    revalidatePath(`/tournaments/${tournament.slug}`)
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
