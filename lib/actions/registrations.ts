/**
 * File: lib/actions/registrations.ts
 * Description: Server actions for managing registrations (admin).
 * Author: Noé Henchoz
 * Date: 2025-12-10
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
import { RegistrationStatus, Role } from '@/prisma/generated/prisma/enums'
import { APP_ROUTES } from '../config/routes'

// ----------------------------------------------------------------------
// TYPES & INTERFACES
// ----------------------------------------------------------------------

type ActionResponse = {
  success: boolean
  message?: string
  error?: string
}

// ----------------------------------------------------------------------
// CONSTANTS
// ----------------------------------------------------------------------

const SUBJECT_MAP: Partial<Record<RegistrationStatus, string>> = {
  [RegistrationStatus.APPROVED]: 'Registration Approved',
  [RegistrationStatus.REJECTED]: 'Registration Rejected',
  [RegistrationStatus.WAITLIST]: 'Registration Status Update',
}

// ----------------------------------------------------------------------
// INTERNAL HELPERS
// ----------------------------------------------------------------------

/**
 * Verifies if the current user has admin privileges.
 */
async function ensureAdminAuth(): Promise<ActionResponse> {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (
    !session?.user ||
    (session.user.role !== Role.ADMIN && session.user.role !== Role.SUPERADMIN)
  ) {
    return {
      success: false,
      error: 'Unauthorized: Admin access required.',
    }
  }

  return { success: true }
}

/**
 * Core logic to update status, send email, and revalidate.
 * Centralizes the logic to avoid code duplication.
 */
async function processRegistrationUpdate(
  registrationId: string,
  newStatus: RegistrationStatus,
): Promise<ActionResponse> {
  // Validation
  const authCheck = await ensureAdminAuth()
  if (!authCheck.success) return authCheck

  if (!registrationId) {
    return { success: false, error: 'Registration ID is required.' }
  }

  try {
    // Database Update
    const registration = await prisma.registration.update({
      where: { id: registrationId },
      data: { status: newStatus },
      include: { tournament: true },
    })

    // Email Notification
    const emailSubjectPrefix =
      SUBJECT_MAP[newStatus] ?? 'Registration Status Update'
    const emailHtml = generateStatusUpdateEmailHtml(
      registration.tournament.title,
      newStatus,
    )

    await sendEmail({
      to: registration.contactEmail,
      subject: `${emailSubjectPrefix} - ${registration.tournament.title}`,
      html: emailHtml,
    })

    // Revalidation
    revalidatePath(
      `${APP_ROUTES.ADMIN_TOURNAMENTS}/${registration.tournamentId}`,
    )

    return { success: true, message: `Status updated to ${newStatus}.` }
  } catch (error) {
    console.error(`Failed to update registration ${registrationId}:`, error)
    return { success: false, error: 'Internal server error during update.' }
  }
}

// ----------------------------------------------------------------------
// PUBLIC ACTIONS
// ----------------------------------------------------------------------

export async function updateRegistrationStatus(
  registrationId: string,
  newStatus: RegistrationStatus,
) {
  return processRegistrationUpdate(registrationId, newStatus)
}

export async function approveRegistration(registrationId: string) {
  return processRegistrationUpdate(registrationId, RegistrationStatus.APPROVED)
}

export async function rejectRegistration(registrationId: string) {
  return processRegistrationUpdate(registrationId, RegistrationStatus.REJECTED)
}

export async function moveToWaitlist(registrationId: string) {
  return processRegistrationUpdate(registrationId, RegistrationStatus.WAITLIST)
}
