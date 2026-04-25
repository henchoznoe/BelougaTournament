/**
 * File: lib/actions/contact.ts
 * Description: Server action for sending contact form emails via Resend.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

'use server'

import { publicAction } from '@/lib/actions/safe-action'
import { CONTACT_EMAIL, CONTACT_SUBJECTS } from '@/lib/config/constants'
import { logger } from '@/lib/core/logger'
import { getResend } from '@/lib/core/resend'
import type { ActionState } from '@/lib/types/actions'
import { buildContactEmailHtml } from '@/lib/utils/contact-email'
import { contactSchema } from '@/lib/validations/contact'

export const sendContactMessage = publicAction({
  schema: contactSchema,
  handler: async (data): Promise<ActionState> => {
    const resend = getResend()
    const subjectLabel =
      /* v8 ignore next */
      CONTACT_SUBJECTS.find(s => s.value === data.subject)?.label ??
      data.subject

    const { error } = await resend.emails.send({
      from: 'Belouga Tournament <noreply@belougatournament.ch>',
      to: CONTACT_EMAIL,
      replyTo: data.email,
      subject: `[Contact] ${subjectLabel} — ${data.fullName}`,
      html: buildContactEmailHtml(data),
    })

    if (error) {
      logger.error({ error }, 'Failed to send contact email via Resend')
      return {
        success: false,
        message: "Une erreur est survenue lors de l'envoi. Veuillez réessayer.",
      }
    }

    return { success: true, message: 'Votre message a été envoyé avec succès.' }
  },
})
