/**
 * File: lib/actions/tournament-manager.ts
 * Description: Server actions for managing specific tournament details (Challonge, Registrations).
 * Author: Noé Henchoz
 * Date: 2025-12-02
 * License: MIT
 */

'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import prisma from '@/lib/prisma'

const updateChallongeIdSchema = z.object({
    challongeId: z.string().optional().or(z.literal('')),
})

export async function updateChallongeId(
    tournamentId: string,
    _prevState: unknown,
    formData: FormData,
) {
    const rawData = {
        challongeId: formData.get('challongeId'),
    }

    const validation = updateChallongeIdSchema.safeParse(rawData)

    if (!validation.success) {
        return {
            success: false,
            message: 'Invalid input',
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
        return { success: true, message: 'Challonge ID updated successfully' }
    } catch (error) {
        console.error('Update Challonge ID Error:', error)
        return { success: false, message: 'Failed to update Challonge ID' }
    }
}

export async function deleteRegistration(
    registrationId: string,
    tournamentId: string,
) {
    try {
        await prisma.registration.delete({
            where: { id: registrationId },
        })
    } catch (error) {
        console.error('Delete Registration Error:', error)
    }

    revalidatePath(`/admin/tournaments/${tournamentId}`)
}
