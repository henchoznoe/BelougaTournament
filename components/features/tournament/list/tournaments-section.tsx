/**
 * File: components/features/tournament/list/tournaments-section.tsx
 * Description: Server Component responsible for fetching and displaying the latest tournaments on the landing page.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import prisma from "@/lib/core/prisma"
import { Visibility } from "@/prisma/generated/prisma/enums"
import { TournamentsList } from "./tournaments-list"

const SECTION_CONFIG = {
  MAX_ITEMS: 3,
} as const

const fetchUpcomingTournaments = async () => {
  return prisma.tournament.findMany({
    orderBy: { startDate: "asc" },
    take: SECTION_CONFIG.MAX_ITEMS,
    where: {
      visibility: Visibility.PUBLIC,
      startDate: { gte: new Date() },
    },
  })
}

export const TournamentsSection = async () => {
  const tournaments = await fetchUpcomingTournaments()

  return <TournamentsList tournaments={tournaments} />
}
