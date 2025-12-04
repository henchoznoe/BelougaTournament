/**
 * File: lib/actions/registrations.ts
 * Description: Server actions for managing registrations (admin).
 * Author: Noé Henchoz
 * Date: 2025-12-04
 * License: MIT
 */

'use server'

import type { RegistrationStatus } from '@prisma/client'
import { revalidatePath } from 'next/cache'
import { getSession, UserRole } from '@/lib/auth'
import { generateStatusUpdateEmailHtml, sendEmail } from '@/lib/email'
import { prisma } from '@/lib/prisma'

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

export async function updateRegistrationStatus(
    registrationId: string,
    newStatus: RegistrationStatus,
    tournamentId: string,
) {
    const auth = await checkAuth()
    if (!auth.success) {
        return { message: auth.message }
    }

    try {
        const registration = await prisma.registration.update({
            where: { id: registrationId },
            data: { status: newStatus },
            include: { tournament: true },
        })

        // Send Status Update Email
        const emailHtml = generateStatusUpdateEmailHtml(
            registration.tournament.title,
            newStatus,
        )

        await sendEmail({
            to: registration.contactEmail,
            subject: `Status Update - ${registration.tournament.title}`,
            html: emailHtml,
        })

        revalidatePath(`/admin/tournaments/${tournamentId}`)
        return { message: 'Status updated successfully.' }
    } catch (error) {
        console.error('Update Status Error:', error)
        return { message: 'Failed to update status.' }
    }
}
