/**
 * File: lib/actions/tournaments.ts
 * Description: Server actions for creating, updating, and deleting tournaments.
 * Author: Noé Henchoz
 * Date: 2025-12-02
 * License: MIT
 */

'use server'

import { revalidatePath, revalidateTag } from 'next/cache'
import { redirect } from 'next/navigation'
import type { z } from 'zod'
import { getSession, UserRole } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { tournamentSchema } from '@/lib/schemas/tournament'
import { Prisma } from '@/prisma/generated/prisma/client'

export type ActionState = {
    errors?: {
        [key: string]: string[]
    }
    message?: string
}

async function checkAuth() {
    const session = await getSession()
    if (
        !session ||
        !session.user ||
        (session.user.role !== UserRole.ADMIN &&
            session.user.role !== UserRole.SUPERADMIN)
    ) {
        return {
            success: false,
            message: 'Unauthorized: Admin access required.',
        }
    }
    return { success: true }
}

export async function createTournament(
    data: z.infer<typeof tournamentSchema>,
): Promise<ActionState> {
    const auth = await checkAuth()
    if (!auth.success) {
        return { message: auth.message }
    }

    const validatedFields = tournamentSchema.safeParse(data)

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Validation Error',
        }
    }

    const { fields, ...tournamentData } = validatedFields.data

    try {
        await prisma.$transaction(async tx => {
            await tx.tournament.create({
                data: {
                    ...tournamentData,
                    fields: {
                        create: fields.map((field, index) => ({
                            ...field,
                            order: index,
                        })),
                    },
                },
            })
        })
    } catch (error) {
        console.error('Database Error:', error)
        if (
            error instanceof Prisma.PrismaClientKnownRequestError &&
            (error as Prisma.PrismaClientKnownRequestError).code === 'P2002' &&
            (
                (error as Prisma.PrismaClientKnownRequestError).meta
                    ?.target as string[]
            )?.includes('slug')
        ) {
            return {
                message:
                    'A tournament with this slug already exists. Please choose another one.',
            }
        }
        return {
            message: 'Database Error: Failed to create tournament.',
        }
    }

    revalidateTag('tournaments', 'default')
    redirect('/admin/tournaments')
}

export async function deleteTournament(id: string): Promise<ActionState> {
    const auth = await checkAuth()
    if (!auth.success) {
        return { message: auth.message }
    }

    try {
        await prisma.tournament.delete({
            where: { id },
        })
    } catch (error) {
        console.error('Delete Error:', error)
        return { message: 'Failed to delete tournament.' }
    }

    revalidateTag('tournaments', 'default')
    return { message: 'Tournament deleted successfully.' }
}

export async function updateTournament(
    id: string,
    data: z.infer<typeof tournamentSchema>,
): Promise<ActionState> {
    const auth = await checkAuth()
    if (!auth.success) {
        return { message: auth.message }
    }

    const validatedFields = tournamentSchema.safeParse(data)

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Validation Error',
        }
    }

    const { fields, ...tournamentData } = validatedFields.data

    try {
        await prisma.$transaction(async tx => {
            // 1. Fetch existing fields to check for deletions and data integrity
            const existingFields = await tx.tournamentField.findMany({
                where: { tournamentId: id },
                include: {
                    _count: {
                        select: { playerData: true },
                    },
                },
            })

            const inputFieldIds = new Set(
                fields.filter(f => f.id).map(f => f.id as string),
            )

            // 2. Identify fields to delete
            const fieldsToDelete = existingFields.filter(
                f => !inputFieldIds.has(f.id),
            )

            // 3. Check if any field to be deleted has associated data
            for (const field of fieldsToDelete) {
                if (field._count.playerData > 0) {
                    throw new Error(
                        `Cannot remove field "${field.label}" as it contains user data.`,
                    )
                }
            }

            // 4. Update Tournament Basic Info
            await tx.tournament.update({
                where: { id },
                data: tournamentData,
            })

            // 5. Delete safe fields
            if (fieldsToDelete.length > 0) {
                await tx.tournamentField.deleteMany({
                    where: {
                        id: { in: fieldsToDelete.map(f => f.id) },
                    },
                })
            }

            // 6. Upsert fields (Update existing, Create new)
            // We iterate to maintain the order from the form
            for (let i = 0; i < fields.length; i++) {
                const field = fields[i]

                if (field.id) {
                    // Security Check: Ensure field belongs to this tournament
                    const belongsToTournament = existingFields.some(
                        f => f.id === field.id,
                    )
                    if (!belongsToTournament) {
                        throw new Error(
                            `Security Error: Field "${field.id}" does not belong to this tournament.`,
                        )
                    }

                    // Update existing field
                    await tx.tournamentField.update({
                        where: { id: field.id },
                        data: {
                            label: field.label,
                            required: field.required,
                            type: field.type,
                            order: i,
                        },
                    })
                } else {
                    // Create new field
                    await tx.tournamentField.create({
                        data: {
                            label: field.label,
                            required: field.required,
                            type: field.type,
                            order: i,
                            tournamentId: id,
                        },
                    })
                }
            }
        })
    } catch (error) {
        console.error('Update Error:', error)
        // Return specific error message if it was a validation error we threw
        if (
            error instanceof Error &&
            error.message.includes('Cannot remove field')
        ) {
            return { message: error.message }
        }
        if (
            error instanceof Error &&
            error.message.includes('Security Error')
        ) {
            return { message: error.message }
        }
        return { message: 'Failed to update tournament.' }
    }

    revalidateTag('tournaments', 'default')
    revalidatePath(`/admin/tournaments/${id}`)
    redirect('/admin/tournaments')
}

export async function exportTournamentData(tournamentId: string) {
    const auth = await checkAuth()
    if (!auth.success) {
        throw new Error(auth.message)
    }

    const tournament = await prisma.tournament.findUnique({
        where: { id: tournamentId },
        include: {
            fields: {
                orderBy: { order: 'asc' },
            },
            registrations: {
                include: {
                    players: {
                        include: {
                            data: true,
                        },
                    },
                },
            },
        },
    })

    if (!tournament) {
        throw new Error('Tournament not found')
    }

    const fields = tournament.fields

    // Flatten data
    const flattenedData = tournament.registrations.flatMap(reg => {
        return reg.players.map(player => {
            const row: Record<string, string> = {
                'Registration ID': reg.id,
                'Team Name': reg.teamName || '',
                'Contact Email': reg.contactEmail,
                Status: reg.status,
                'Registration Date': reg.createdAt.toISOString(),
                'Player Nickname': player.nickname,
            }

            // Add dynamic fields
            for (const field of fields) {
                const playerData = player.data.find(
                    d => d.tournamentFieldId === field.id,
                )
                row[field.label] = playerData ? playerData.value : ''
            }

            return row
        })
    })

    return JSON.stringify(flattenedData)
}
