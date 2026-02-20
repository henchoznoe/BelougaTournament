/**
 * File: components/features/tournament/card/tournament-card.tsx
 * Description: Specific card component for displaying tournament summary.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import Link from "next/link"
import { Calendar, ChevronRight, Users, ArrowRight } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { type PublicTournament } from "@/lib/services/tournament.service"
import { formatDateTime } from "@/lib/utils"
import { ROUTES } from "@/lib/config/routes"
import { TournamentFormat } from "@/prisma/generated/prisma/enums"

type TournamentCardProps = {
  tournament: PublicTournament
}

export const TournamentCard = ({ tournament }: TournamentCardProps) => {
  return (
    <Card className="group h-full border-zinc-800 bg-zinc-900/50 backdrop-blur-sm transition-all hover:border-blue-500/50 hover:shadow-[0_0_30px_-10px_rgba(37,99,235,0.3)] hover:-translate-y-1">
      <CardHeader>
        <div className="mb-4 flex items-center justify-between">
          <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-400 ring-1 ring-blue-500/20">
            {tournament.format}
          </span>
          <Badge variant="outline" className="border-zinc-700 text-zinc-400">
            Tournoi {tournament.id}
          </Badge>
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
              ? `${tournament._count.registrations} / ${tournament.maxParticipants}`
              : `${tournament._count.registrations}`}
            <span className="ml-2 text-zinc-400">
              {tournament.format === TournamentFormat.TEAM
                ? "Équipe"
                : "Joueur"}
            </span>
          </span>
        </div>
      </CardContent>
      <CardFooter>
        <Button
          asChild
          className="w-full bg-zinc-800 font-semibold text-white hover:bg-blue-600 transition-all duration-300"
        >
          <Link href={`${ROUTES.TOURNAMENTS}/${tournament.slug}`}>
            <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium">
              Voir les détails
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </Button>
      </CardFooter>
    </Card>
  )
}
