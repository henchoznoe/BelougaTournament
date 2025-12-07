/**
 * File: components/public/landing/tournaments-section.tsx
 * Description: Server Component responsible for fetching and displaying the latest tournaments on the landing page.
 * Author: Noé Henchoz
 * Date: 2025-12-07
 * License: MIT
 */

import prisma from "@/lib/db/prisma";
import { TournamentsList } from "./tournaments-list";

// Constants
const SECTION_CONFIG = {
  MAX_ITEMS: 3,
} as const;

const fetchUpcomingTournaments = async () => {
  return prisma.tournament.findMany({
    orderBy: { startDate: "asc" },
    take: SECTION_CONFIG.MAX_ITEMS,
    where: {
      visibility: 'PUBLIC',
      startDate: { gte: new Date() },
    },
  });
}

export const TournamentsSection = async () => {
  const tournaments = await fetchUpcomingTournaments();

  return <TournamentsList tournaments={tournaments} />;
}
