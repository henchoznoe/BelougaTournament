import { z } from 'zod'
import { fr } from '@/lib/i18n/dictionaries/fr'

export const registrationSchema = z.object({
  contactEmail: z.string().email(fr.common.server.validations.emailInvalid),
  players: z
    .array(
      z.object({
        data: z.record(z.string(), z.string()), // fieldId -> value
        nickname: z
          .string()
          .min(1, fr.common.server.validations.nicknameRequired),
      }),
    )
    .min(1, fr.common.server.validations.playersMin),
  teamName: z.string().optional(),
  tournamentId: z.string().uuid(),
})

export type RegistrationInput = z.infer<typeof registrationSchema>
