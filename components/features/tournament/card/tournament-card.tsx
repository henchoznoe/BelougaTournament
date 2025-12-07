/**
 * File: components/features/tournament/card/tournament-card.tsx
 * Description: Specific card component for displaying tournament summary.
 * Author: Noé Henchoz
 * Date: 2025-12-07
 * License: MIT
 */

// ----------------------------------------------------------------------
// IMPORTS
// ----------------------------------------------------------------------

import Link from "next/link"
import { Calendar, ChevronRight, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { type PublicTournament } from "@/lib/data/tournaments"
import { formatDateTime } from "@/lib/utils"

// ----------------------------------------------------------------------
// TYPES & INTERFACES
// ----------------------------------------------------------------------

type TournamentCardProps = {
  tournament: PublicTournament
}

// ----------------------------------------------------------------------
// CONSTANTS
// ----------------------------------------------------------------------

const CONTENT = {
  BTN_DETAILS: "Voir les détails",
  FORMAT: {
    TEAM: "Équipes",
    PLAYER: "Joueurs",
  },
  PREFIX_ID: "ID:",
  PREFIX_REGISTERED: "Inscrit",
} as const

// ----------------------------------------------------------------------
// COMPONENT
// ----------------------------------------------------------------------

export const TournamentCard = ({ tournament }: TournamentCardProps) => {
  return (
    <Card className="group h-full border-zinc-800 bg-zinc-900/50 backdrop-blur-sm transition-all hover:border-blue-500/50 hover:shadow-[0_0_30px_-10px_rgba(37,99,235,0.3)] hover:-translate-y-1">
      <CardHeader>
        <div className="mb-4 flex items-center justify-between">
          <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-400 ring-1 ring-blue-500/20">
            {tournament.format}
          </span>
          <span className="text-xs text-zinc-500 font-mono">
            {CONTENT.PREFIX_ID} {tournament.slug.slice(0, 8)}
          </span>
        </div>
        <CardTitle className="text-2xl text-white group-hover:text-blue-400 transition-colors">
          {tournament.title}
        </CardTitle>
        <CardDescription className="line-clamp-2 text-zinc-400 mt-2">
          {tournament.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 text-sm text-zinc-300">
        <div className="flex items-center gap-3">
          <div className="flex size-8 items-center justify-center rounded-lg bg-zinc-800/50 group-hover:bg-blue-500/10 transition-colors">
            <Calendar className="size-4 text-blue-500" />
          </div>
          <span className="font-medium">
            {formatDateTime(tournament.startDate)}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex size-8 items-center justify-center rounded-lg bg-zinc-800/50 group-hover:bg-green-500/10 transition-colors">
            <Users className="size-4 text-green-500" />
          </div>
          <span>
            {tournament.maxParticipants
              ? `${tournament._count.registrations} / ${tournament.maxParticipants} ${
                  tournament.format === "TEAM"
                    ? CONTENT.FORMAT.TEAM
                    : CONTENT.FORMAT.PLAYER
                }`
              : `${tournament._count.registrations} ${CONTENT.PREFIX_REGISTERED}${
                  tournament._count.registrations > 1 ? "s" : ""
                }`}
          </span>
        </div>
      </CardContent>
      <CardFooter>
        <Button
          asChild
          className="w-full bg-zinc-800 font-semibold text-white hover:bg-blue-600 transition-all duration-300"
        >
          <Link href={`/tournaments/${tournament.slug}`}>
            {CONTENT.BTN_DETAILS}
            <ChevronRight className="ml-2 size-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  )
}
