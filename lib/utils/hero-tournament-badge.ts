/**
 * File: lib/utils/hero-tournament-badge.ts
 * Description: Shared helpers for computing the landing hero tournament badge state and refresh timing.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import {
  DAY_IN_MS,
  MINUTE_IN_MS,
  MINUTES_PER_HOUR,
  SECOND_IN_MS,
} from '@/lib/config/constants'
import type {
  HeroTournamentBadge,
  HeroTournamentBadgeTournament,
} from '@/lib/types/tournament'

export const DEFAULT_HERO_TOURNAMENT_BADGE: HeroTournamentBadge = {
  label: 'Aucun tournoi en cours',
  variant: 'idle',
}

const getTimestamp = (value: Date | string) => new Date(value).getTime()

const getSortedTournaments = (tournaments: HeroTournamentBadgeTournament[]) => {
  return [...tournaments].sort(
    (a, b) => getTimestamp(a.startDate) - getTimestamp(b.startDate),
  )
}

/** Formats the delay before a tournament starts for the hero badge. */
const formatHeroBadgeDelay = (startDate: Date | string, now: Date): string => {
  const diffMs = getTimestamp(startDate) - now.getTime()

  if (diffMs >= DAY_IN_MS) {
    const days = Math.ceil(diffMs / DAY_IN_MS)
    return `${days} jour${days > 1 ? 's' : ''}`
  }

  const totalMinutes = Math.max(1, Math.ceil(diffMs / MINUTE_IN_MS))
  const hours = Math.floor(totalMinutes / MINUTES_PER_HOUR)
  const minutes = totalMinutes % MINUTES_PER_HOUR

  if (hours === 0) {
    return `${minutes} minute${minutes > 1 ? 's' : ''}`
  }

  if (minutes === 0) {
    return `${hours} heure${hours > 1 ? 's' : ''}`
  }

  return `${hours} heure${hours > 1 ? 's' : ''} ${minutes} minute${minutes > 1 ? 's' : ''}`
}

/** Resolves the current landing hero badge from published tournaments. */
export const resolveHeroTournamentBadge = (
  tournaments: HeroTournamentBadgeTournament[],
  now = new Date(),
): HeroTournamentBadge => {
  const sortedTournaments = getSortedTournaments(tournaments)
  const nowMs = now.getTime()

  const liveTournament = sortedTournaments.find(
    tournament =>
      getTimestamp(tournament.startDate) <= nowMs &&
      getTimestamp(tournament.endDate) > nowMs,
  )

  if (liveTournament) {
    return {
      label: `${liveTournament.title} en cours`,
      variant: 'live',
    }
  }

  const upcomingTournament = sortedTournaments.find(
    tournament => getTimestamp(tournament.startDate) > nowMs,
  )

  if (upcomingTournament) {
    return {
      label: `${upcomingTournament.title} dans ${formatHeroBadgeDelay(upcomingTournament.startDate, now)}`,
      variant: 'upcoming',
    }
  }

  return DEFAULT_HERO_TOURNAMENT_BADGE
}

/** Returns the slug of the currently live or next upcoming tournament, or null if none. */
export const resolveActiveTournamentSlug = (
  tournaments: HeroTournamentBadgeTournament[],
  now = new Date(),
): string | null => {
  const sorted = getSortedTournaments(tournaments)
  const nowMs = now.getTime()
  const live = sorted.find(
    t => getTimestamp(t.startDate) <= nowMs && getTimestamp(t.endDate) > nowMs,
  )
  if (live) return live.slug
  const upcoming = sorted.find(t => getTimestamp(t.startDate) > nowMs)
  return upcoming?.slug ?? null
}

/** Returns the exact delay before the hero badge should be recomputed. */
export const getNextHeroTournamentBadgeUpdateDelay = (
  tournaments: HeroTournamentBadgeTournament[],
  now = new Date(),
): number | null => {
  const sortedTournaments = getSortedTournaments(tournaments)
  const nowMs = now.getTime()

  const liveTournament = sortedTournaments.find(
    tournament =>
      getTimestamp(tournament.startDate) <= nowMs &&
      getTimestamp(tournament.endDate) > nowMs,
  )

  if (liveTournament) {
    return Math.max(SECOND_IN_MS, getTimestamp(liveTournament.endDate) - nowMs)
  }

  const upcomingTournament = sortedTournaments.find(
    tournament => getTimestamp(tournament.startDate) > nowMs,
  )

  if (!upcomingTournament) {
    return null
  }

  const diffMs = getTimestamp(upcomingTournament.startDate) - nowMs

  if (diffMs >= DAY_IN_MS) {
    const remainder = diffMs % DAY_IN_MS
    return Math.max(SECOND_IN_MS, remainder === 0 ? DAY_IN_MS : remainder)
  }

  const remainder = diffMs % MINUTE_IN_MS
  return Math.max(SECOND_IN_MS, remainder === 0 ? MINUTE_IN_MS : remainder)
}
