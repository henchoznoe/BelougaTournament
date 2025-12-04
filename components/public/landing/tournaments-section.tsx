import { prisma } from "@/lib/prisma";
import { TournamentsList } from "./tournaments-list";

async function getTournaments() {
  return await prisma.tournament.findMany({
    orderBy: { startDate: "asc" },
    take: 3,
    where: { isArchived: false },
  });
}

export async function TournamentsSection() {
  const tournaments = await getTournaments();
  return <TournamentsList tournaments={tournaments} />;
}
