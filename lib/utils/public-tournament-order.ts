/**
 * File: lib/utils/public-tournament-order.ts
 * Description: Orders public tournaments and excludes finished events from upcoming selections.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

type TournamentDates = { startDate: Date; endDate: Date }

/** Keep current/upcoming events chronological, followed by the most recent finished events. */
export const orderPublishedTournaments = <T extends TournamentDates>(
  tournaments: T[],
  now: Date,
): T[] =>
  tournaments.toSorted((a, b) => {
    const aFinished = new Date(a.endDate).getTime() < now.getTime()
    const bFinished = new Date(b.endDate).getTime() < now.getTime()
    if (aFinished !== bFinished) return aFinished ? 1 : -1
    const difference =
      new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    return aFinished ? -difference : difference
  })

export const selectUpcomingTournaments = <T extends TournamentDates>(
  tournaments: T[],
  now: Date,
): T[] =>
  orderPublishedTournaments(tournaments, now).filter(
    tournament => new Date(tournament.endDate).getTime() >= now.getTime(),
  )
