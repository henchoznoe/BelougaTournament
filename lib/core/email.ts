/**
 * File: lib/email.ts
 * Description: Email service module to handle transactional emails via Resend.
 * Author: Noé Henchoz
 * Date: 2025-12-07
 * License: MIT
 */

import { Resend } from 'resend'
import { env } from '@/lib/core/env'
import { fr } from '@/lib/i18n/dictionaries/fr'

// ----------------------------------------------------------------------
// TYPES & INTERFACES
// ----------------------------------------------------------------------

type EmailPayload = {
  to: string
  subject: string
  html: string
}

type EmailResponse = {
  success: boolean
  data?: unknown
  error?: unknown
}

// ----------------------------------------------------------------------
// LOGIC
// ----------------------------------------------------------------------

const getResendClient = (): { client: Resend; fromEmail: string } => {
  return {
    client: new Resend(env.RESEND_API_KEY),
    fromEmail: env.RESEND_FROM,
  }
}

export const sendEmail = async ({
  to,
  subject,
  html,
}: EmailPayload): Promise<EmailResponse> => {
  try {
    const { client, fromEmail } = getResendClient()

    const data = await client.emails.send({
      from: fromEmail,
      to,
      subject,
      html,
    })

    return { success: true, data }
  } catch (error) {
    console.error(fr.common.email.errorSend, error)

    return {
      success: false,
      error: error instanceof Error ? error.message : fr.common.email.errorSend,
    }
  }
}

export const generateRegistrationEmailHtml = (
  tournamentTitle: string,
  status: string,
  cancellationUrl: string,
): string => {
  return `
    <div style="font-family: sans-serif; color: #333;">
      <h1>${fr.common.email.registrationReceived.title}</h1>
      <p>${fr.common.email.registrationReceived.thankYou(tournamentTitle)}</p>
      <p>${fr.common.email.registrationReceived.currentStatus(status)}</p>
      <p>${fr.common.email.registrationReceived.notification}</p>
      <br/>
      <p>${fr.common.email.registrationReceived.cancelText}</p>
      <p><a href="${cancellationUrl}" style="color: #ef4444;">${fr.common.email.registrationReceived.cancelLinkText}</a></p>
      <br/>
      <p>${fr.common.email.registrationReceived.closing}</p>
      <p>${fr.common.email.registrationReceived.teamName}</p>
    </div>
  `
}

export const generateStatusUpdateEmailHtml = (
  tournamentTitle: string,
  status: string,
): string => {
  return `
    <div style="font-family: sans-serif; color: #333;">
      <h1>${fr.common.email.statusUpdate.title}</h1>
      <p>${fr.common.email.statusUpdate.content(tournamentTitle)}</p>
      <p>${fr.common.email.statusUpdate.newStatus(status)}</p>
      <br/>
      <p>${fr.common.email.registrationReceived.closing}</p>
      <p>${fr.common.email.registrationReceived.teamName}</p>
    </div>
  `
}
