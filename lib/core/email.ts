/**
 * File: lib/core/email.ts
 * Description: Email service module to handle transactional emails via Resend.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { Resend } from 'resend'
import { env } from '@/lib/core/env'

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
    console.error('Error sending email:', error)

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error sending email',
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
      <h1>Inscription reçue</h1>
      <p>Vous avez inscrit votre équipe pour le tournoi ${tournamentTitle}</p>
      <p>Statut actuel: ${status}</p>
      <p>Vous pouvez annuler votre inscription en cliquant sur le lien suivant: <a href="${cancellationUrl}">Annuler l'inscription</a></p>
      <p>Cordialement</p>
    </div>
  `
}

export const generateStatusUpdateEmailHtml = (
  tournamentTitle: string,
  status: string,
): string => {
  return `
    <div style="font-family: sans-serif; color: #333;">
      <h1>Mise à jour du tournoi ${tournamentTitle}</h1>
      <p>Nous tenons à vous informer que votre inscription pour le tournoi ${tournamentTitle} a été mise à jour.</p>
      <p>Statut actuel: ${status}</p>
      <p>Cordialement</p>
    </div>
  `
}
