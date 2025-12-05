/**
 * File: lib/email.ts
 * Description: Email service module to handle transactional emails via Resend.
 * Author: Noé Henchoz
 * Date: 2025-12-05
 * License: MIT
 */

import { Resend } from 'resend'

// Types
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

// Constants
const ENV_VAR_KEYS = {
    API_KEY: 'RESEND_API_KEY',
    FROM_EMAIL: 'RESEND_FROM_EMAIL',
} as const

const ERRORS = {
    MISSING_ENV: `Environment variables ${ENV_VAR_KEYS.API_KEY} and ${ENV_VAR_KEYS.FROM_EMAIL} must be defined.`,
    SEND_FAILED: 'Failed to send email via Resend.',
} as const

const TEAM_NAME = 'The Belouga Tournament Team'

function getResendClient(): { client: Resend; fromEmail: string } {
    const apiKey = process.env[ENV_VAR_KEYS.API_KEY]
    const fromEmail = process.env[ENV_VAR_KEYS.FROM_EMAIL]

    if (!apiKey || !fromEmail) {
        throw new Error(ERRORS.MISSING_ENV)
    }

    return {
        client: new Resend(apiKey),
        fromEmail,
    }
}

export async function sendEmail({
    to,
    subject,
    html,
}: EmailPayload): Promise<EmailResponse> {
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
        console.error(ERRORS.SEND_FAILED, error)

        return {
            success: false,
            error: error instanceof Error ? error.message : ERRORS.SEND_FAILED,
        }
    }
}

export function generateRegistrationEmailHtml(
    tournamentTitle: string,
    status: string,
    cancellationUrl: string,
): string {
    return `
    <div style="font-family: sans-serif; color: #333;">
      <h1>Registration Received</h1>
      <p>Thank you for registering for <strong>${tournamentTitle}</strong>.</p>
      <p>Your current registration status is: <strong>${status}</strong>.</p>
      <p>We will notify you if there are any changes to your status.</p>
      <br/>
      <p>If you wish to cancel your registration, you can do so by clicking the link below:</p>
      <p><a href="${cancellationUrl}" style="color: #ef4444;">Cancel my registration</a></p>
      <br/>
      <p>Best regards,</p>
      <p>${TEAM_NAME}</p>
    </div>
  `
}

export function generateStatusUpdateEmailHtml(
    tournamentTitle: string,
    status: string,
): string {
    return `
    <div style="font-family: sans-serif; color: #333;">
      <h1>Registration Status Update</h1>
      <p>Your registration status for <strong>${tournamentTitle}</strong> has been updated.</p>
      <p>New Status: <strong>${status}</strong></p>
      <br/>
      <p>Best regards,</p>
      <p>${TEAM_NAME}</p>
    </div>
  `
}
