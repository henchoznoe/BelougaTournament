/**
 * File: lib/actions/registrations.ts
 * Description: Server actions for managing registrations (admin).
 * Author: Noé Henchoz
 * Date: 2025-12-07
 * License: MIT
 */

'use server'

// ----------------------------------------------------------------------
// IMPORTS
// ----------------------------------------------------------------------

import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
import auth from '@/lib/auth'
import prisma from '@/lib/db/prisma'
import { generateStatusUpdateEmailHtml, sendEmail } from '@/lib/email'
import { type RegistrationStatus, Role } from '@/prisma/generated/prisma/enums'
import { APP_ROUTES } from '../config/routes'

// ----------------------------------------------------------------------
// LOGIC
// ----------------------------------------------------------------------

const checkAuth = async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  })
  if (
    !session ||
    !session.user ||
    (session.user.role !== Role.ADMIN && session.user.role !== Role.SUPERADMIN)
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

    revalidatePath(`${APP_ROUTES.ADMIN_TOURNAMENTS}/${tournamentId}`)
    return { message: 'Status updated successfully.' }
  } catch (error) {
    console.error('Update Status Error:', error)
    return { message: 'Failed to update status.' }
  }
}

export async function approveRegistration(registrationId: string) {
  const auth = await checkAuth()
  if (!auth.success) return { success: false, error: auth.message }

  try {
    const registration = await prisma.registration.update({
      where: { id: registrationId },
      data: { status: 'APPROVED' },
      include: { tournament: true },
    })

    const emailHtml = generateStatusUpdateEmailHtml(
      registration.tournament.title,
      'APPROVED',
    )

    await sendEmail({
      to: registration.contactEmail,
      subject: `Registration Approved - ${registration.tournament.title}`,
      html: emailHtml,
    })

    revalidatePath(
      `${APP_ROUTES.ADMIN_TOURNAMENTS}/${registration.tournamentId}`,
    )
    return { success: true }
  } catch (error) {
    console.error('Failed to approve registration:', error)
    return { success: false, error: 'Failed to approve registration' }
  }
}

export async function rejectRegistration(registrationId: string) {
  const auth = await checkAuth()
  if (!auth.success) return { success: false, error: auth.message }

  try {
    const registration = await prisma.registration.update({
      where: { id: registrationId },
      data: { status: 'REJECTED' },
      include: { tournament: true },
    })

    const emailHtml = generateStatusUpdateEmailHtml(
      registration.tournament.title,
      'REJECTED',
    )

    await sendEmail({
      to: registration.contactEmail,
      subject: `Registration Rejected - ${registration.tournament.title}`,
      html: emailHtml,
    })

    revalidatePath(
      `${APP_ROUTES.ADMIN_TOURNAMENTS}/${registration.tournamentId}`,
    )
    return { success: true }
  } catch (error) {
    console.error('Failed to reject registration:', error)
    return { success: false, error: 'Failed to reject registration' }
  }
}

export async function moveToWaitlist(registrationId: string) {
  const auth = await checkAuth()
  if (!auth.success) return { success: false, error: auth.message }

  try {
    const registration = await prisma.registration.update({
      where: { id: registrationId },
      data: { status: 'WAITLIST' },
      include: { tournament: true },
    })

    const emailHtml = generateStatusUpdateEmailHtml(
      registration.tournament.title,
      'WAITLIST',
    )

    await sendEmail({
      to: registration.contactEmail,
      subject: `Registration Status Update - ${registration.tournament.title}`,
      html: emailHtml,
    })

    revalidatePath(
      `${APP_ROUTES.ADMIN_TOURNAMENTS}/${registration.tournamentId}`,
    )
    return { success: true }
  } catch (error) {
    console.error('Failed to move to waitlist:', error)
    return { success: false, error: 'Failed to move to waitlist' }
  }
}
