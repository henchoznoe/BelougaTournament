/**
 * File: lib/actions/tournament-manager.ts
 * Description: Server actions for managing specific tournament details (Challonge, Registrations).
 * Author: Noé Henchoz
 * Date: 2025-12-02
 * License: MIT
 */

'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'

export async function updateChallongeId(
    tournamentId: string,
    formData: FormData,
) {
    const challongeId = formData.get('challongeId') as string

    try {
        await prisma.tournament.update({
            where: { id: tournamentId },
            data: { challongeId },
        })
    } catch (error) {
        console.error('Update Challonge ID Error:', error)
    }

    revalidatePath(`/admin/tournaments/${tournamentId}`)
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
