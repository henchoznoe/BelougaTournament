/**
 * File: lib/utils/registration-feedback.ts
 * Description: Validates registration responses and resolves truthful payment return feedback.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { z } from 'zod'
import type {
  PublicTournamentListItem,
  UserTournamentRegistrationState,
} from '@/lib/types/tournament'
import {
  PaymentStatus,
  RegistrationStatus,
  TournamentFormat,
} from '@/prisma/generated/prisma/enums'

export const getRegistrationCapacity = (
  tournament: Pick<PublicTournamentListItem, 'format' | 'maxTeams' | '_count'>,
  availableTeams: number,
): 'available' | 'join-only' | 'full' => {
  if (!tournament.maxTeams || tournament.maxTeams <= 0) return 'available'
  if (tournament.format === TournamentFormat.SOLO)
    return tournament._count.registrations >= tournament.maxTeams
      ? 'full'
      : 'available'
  if (tournament._count.teams < tournament.maxTeams) return 'available'
  return availableTeams > 0 ? 'join-only' : 'full'
}

const registrationStateSchema = z
  .object({
    id: z.string().min(1),
    status: z.enum(RegistrationStatus),
    paymentStatus: z.enum(PaymentStatus),
    expiresAt: z
      .string()
      .datetime()
      .nullable()
      .transform(value => (value ? new Date(value) : null)),
  })
  .nullable()

export const fetchRegistrationState = async (
  tournamentId: string,
): Promise<UserTournamentRegistrationState | null> => {
  const response = await fetch(
    `/api/tournaments/${encodeURIComponent(tournamentId)}/registration-state`,
    { cache: 'no-store' },
  )
  if (!response.ok)
    throw new Error(
      'Impossible de vérifier votre inscription. Réessayez pour continuer.',
    )
  return registrationStateSchema.parse(await response.json())
}

export const getPaymentReturnFeedback = (
  state: UserTournamentRegistrationState | null,
  cancelled: boolean,
  cancellationSucceeded: boolean,
) => {
  if (state?.status === RegistrationStatus.CONFIRMED)
    return {
      tone: 'success' as const,
      title: 'Votre inscription est confirmée',
      message:
        'Retrouvez votre inscription et les actions de votre équipe dans votre espace joueur.',
    }
  if (cancelled && cancellationSucceeded && state === null)
    return {
      tone: 'info' as const,
      title: 'Paiement annulé',
      message:
        'Votre inscription en attente a été annulée et votre place a été libérée. Vous pouvez recommencer ci-dessous.',
    }
  return {
    tone: 'info' as const,
    title: cancelled
      ? 'Vérification de l’annulation'
      : 'Confirmation du paiement en cours',
    message: cancelled
      ? 'La libération de votre place n’est pas encore confirmée. Actualisez votre inscription avant de recommencer.'
      : 'Nous attendons la confirmation du serveur. Aucun nouveau paiement n’est nécessaire pendant cette vérification.',
  }
}
