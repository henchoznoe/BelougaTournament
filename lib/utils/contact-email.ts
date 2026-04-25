/**
 * File: lib/utils/contact-email.ts
 * Description: Builds the HTML email body for contact form submissions.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { CONTACT_SUBJECTS } from '@/lib/config/constants'
import type { ContactInput } from '@/lib/validations/contact'

/** Resolves the human-readable label for a subject value. */
const resolveSubjectLabel = (value: string): string =>
  CONTACT_SUBJECTS.find(s => s.value === value)?.label ?? value

/** Escapes HTML special characters to prevent injection in the email body. */
const escapeHtml = (text: string): string =>
  text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

/** Builds a complete HTML email from the contact form data. */
export const buildContactEmailHtml = (data: ContactInput): string => {
  const subjectLabel = resolveSubjectLabel(data.subject)
  const escapedMessage = escapeHtml(data.message).replace(/\n/g, '<br />')
  const phoneRow = data.phone
    ? `<tr>
        <td style="padding:8px 12px;color:#a1a1aa;font-size:14px;white-space:nowrap;vertical-align:top;">Téléphone</td>
        <td style="padding:8px 12px;color:#e4e4e7;font-size:14px;">${escapeHtml(data.phone)}</td>
      </tr>`
    : ''

  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="utf-8" /></head>
<body style="margin:0;padding:0;background-color:#09090b;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#09090b;padding:40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color:#18181b;border-radius:16px;border:1px solid #27272a;overflow:hidden;">
          <!-- Header -->
          <tr>
            <td style="padding:32px 32px 24px;border-bottom:1px solid #27272a;">
              <h1 style="margin:0;font-size:20px;font-weight:700;color:#fafafa;">Nouveau message de contact</h1>
              <p style="margin:8px 0 0;font-size:14px;color:#a1a1aa;">Via le formulaire de belougatournament.ch</p>
            </td>
          </tr>
          <!-- Fields -->
          <tr>
            <td style="padding:24px 20px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #27272a;border-radius:12px;overflow:hidden;">
                <tr style="background-color:#27272a40;">
                  <td style="padding:8px 12px;color:#a1a1aa;font-size:14px;white-space:nowrap;vertical-align:top;">Nom complet</td>
                  <td style="padding:8px 12px;color:#e4e4e7;font-size:14px;">${escapeHtml(data.fullName)}</td>
                </tr>
                <tr>
                  <td style="padding:8px 12px;color:#a1a1aa;font-size:14px;white-space:nowrap;vertical-align:top;">Email</td>
                  <td style="padding:8px 12px;color:#e4e4e7;font-size:14px;">
                    <a href="mailto:${escapeHtml(data.email)}" style="color:#60a5fa;text-decoration:none;">${escapeHtml(data.email)}</a>
                  </td>
                </tr>
                ${phoneRow}
                <tr style="background-color:#27272a40;">
                  <td style="padding:8px 12px;color:#a1a1aa;font-size:14px;white-space:nowrap;vertical-align:top;">Sujet</td>
                  <td style="padding:8px 12px;color:#e4e4e7;font-size:14px;">${escapeHtml(subjectLabel)}</td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Message -->
          <tr>
            <td style="padding:0 20px 24px;">
              <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#a1a1aa;text-transform:uppercase;letter-spacing:0.05em;">Message</p>
              <div style="padding:16px;background-color:#09090b;border:1px solid #27272a;border-radius:12px;color:#e4e4e7;font-size:14px;line-height:1.6;">
                ${escapedMessage}
              </div>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:16px 32px;border-top:1px solid #27272a;text-align:center;">
              <p style="margin:0;font-size:12px;color:#52525b;">Belouga Tournament — Message envoyé le ${new Date().toLocaleDateString('fr-CH', { day: '2-digit', month: '2-digit', year: 'numeric' })} à ${new Date().toLocaleTimeString('fr-CH', { hour: '2-digit', minute: '2-digit' })}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}
