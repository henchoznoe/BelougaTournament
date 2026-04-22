/**
 * File: lib/utils/tournament-status.ts
 * Description: Shared helpers for public tournament registration status labels and stream channel normalization.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { TournamentStatus } from '@/prisma/generated/prisma/enums'

interface TournamentRegistrationWindow {
  status: TournamentStatus
  registrationOpen: Date | string
  registrationClose: Date | string
}

export type TournamentRegistrationPhase =
  | 'archived'
  | 'upcoming'
  | 'open'
  | 'closed'

export interface TournamentRegistrationBadge {
  phase: TournamentRegistrationPhase
  isOpen: boolean
  label: string
  className: string
  dotClassName: string
}

/** Resolves the public registration badge state for a tournament. */
export const getTournamentRegistrationBadge = (
  tournament: TournamentRegistrationWindow,
  now = new Date(),
): TournamentRegistrationBadge => {
  const open = new Date(tournament.registrationOpen)
  const close = new Date(tournament.registrationClose)

  if (tournament.status === TournamentStatus.ARCHIVED) {
    return {
      phase: 'archived',
      isOpen: false,
      label: 'Tournoi terminé',
      className: 'border-zinc-500/30 bg-zinc-500/10 text-zinc-400',
      dotClassName: 'bg-zinc-400',
    }
  }

  if (now < open) {
    return {
      phase: 'upcoming',
      isOpen: false,
      label: 'Inscriptions bientôt',
      className: 'border-amber-500/30 bg-amber-500/10 text-amber-400',
      dotClassName: 'bg-amber-400',
    }
  }

  if (now <= close) {
    return {
      phase: 'open',
      isOpen: true,
      label: 'Inscriptions ouvertes',
      className: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
      dotClassName: 'bg-emerald-400 animate-pulse',
    }
  }

  return {
    phase: 'closed',
    isOpen: false,
    label: 'Inscriptions fermées',
    className: 'border-red-500/30 bg-red-500/10 text-red-400',
    dotClassName: 'bg-red-400',
  }
}

/** Extracts a Twitch channel name from a full URL, or returns the raw value when parsing fails. */
export const extractTwitchChannel = (streamUrl: string): string => {
  try {
    const url = new URL(streamUrl)
    if (url.hostname.includes('twitch.tv')) {
      const parts = url.pathname.split('/').filter(Boolean)
      return parts[0] ?? streamUrl
    }

    return streamUrl
  } catch {
    return streamUrl
  }
}
