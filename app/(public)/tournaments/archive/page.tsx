/**
 * File: app/(public)/tournaments/archive/page.tsx
 * Description: Public page for archived tournaments.
 * Author: Noé Henchoz
 * Date: 2025-12-07
 * License: MIT
 */

import { Calendar, Trophy, Users } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import prisma from '@/lib/db/prisma'
import { formatDateTime } from '@/lib/utils'

// Types
interface ArchivedTournament {
  id: string
  title: string
  description: string
  slug: string
  startDate: Date
  format: string
  maxParticipants: number | null
}

// Constants
const CONTENT = {
  TITLE: 'Tournois archivés',
  SUBTITLE: 'Explorez les tournois passés et leurs résultats.',
  EMPTY: 'Aucun tournoi archivé trouvé pour le moment.',
  BTN_RESULTS: 'Voir les résultats',
  LABEL_FORMAT: 'Format :',
  LABEL_PLAYERS: (count: number | null) =>
    count ? `${count} places` : 'Places illimitées',
} as const

const SEO_CONFIG = {
  TITLE: 'Archives des Tournois',
  DESCRIPTION:
    "Consultez l'historique et les résultats des tournois Belouga passés.",
} as const

// Metadata
export const metadata: Metadata = {
  title: SEO_CONFIG.TITLE,
  description: SEO_CONFIG.DESCRIPTION,
}

const fetchArchivedTournaments = async (): Promise<ArchivedTournament[]> => {
  return prisma.tournament.findMany({
    where: {
      visibility: 'PUBLIC',
      endDate: { lt: new Date() },
    },
    orderBy: { endDate: 'desc' },
  })
}

const ArchivedTournamentCard = ({
  tournament,
}: {
  tournament: ArchivedTournament
}) => {
  return (
    <Card className="flex flex-col border-zinc-800 bg-zinc-900/50 opacity-90 transition-all hover:border-zinc-700 hover:opacity-100">
      <CardHeader>
        <CardTitle className="text-xl text-zinc-200">
          {tournament.title}
        </CardTitle>
        <CardDescription className="line-clamp-2 text-zinc-500">
          {tournament.description}
        </CardDescription>
      </CardHeader>

      <CardContent className="flex-1 space-y-4 text-sm text-zinc-400">
        {/* Date */}
        <div className="flex items-center gap-2">
          <Calendar className="size-4 text-zinc-500" />
          <span className="capitalize">
            {formatDateTime(tournament.startDate)}
          </span>
        </div>

        {/* Format */}
        <div className="flex items-center gap-2">
          <Trophy className="size-4 text-yellow-500/50" />
          <span>
            {CONTENT.LABEL_FORMAT} {tournament.format}
          </span>
        </div>

        {/* Participants Capacity */}
        <div className="flex items-center gap-2">
          <Users className="size-4 text-green-500/50" />
          <span>{CONTENT.LABEL_PLAYERS(tournament.maxParticipants)}</span>
        </div>
      </CardContent>

      <CardFooter className="mt-auto">
        <Button
          asChild
          variant="secondary"
          className="w-full bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white"
        >
          <Link href={`/tournaments/${tournament.slug}`}>
            {CONTENT.BTN_RESULTS}
          </Link>
        </Button>
      </CardFooter>
    </Card>
  )
}

const EmptyArchiveState = () => {
  return (
    <div className="col-span-full py-24 text-center text-zinc-500">
      <p>{CONTENT.EMPTY}</p>
    </div>
  )
}

export default async function ArchivePage() {
  const tournaments = await fetchArchivedTournaments()

  return (
    <div className="container mx-auto min-h-[80vh] px-4 py-12">
      {/* Header */}
      <div className="mb-12 space-y-4">
        <h1 className="text-4xl font-bold tracking-tight text-white">
          {CONTENT.TITLE}
        </h1>
        <p className="text-lg text-zinc-400">{CONTENT.SUBTITLE}</p>
      </div>

      {/* Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {tournaments.length > 0 ? (
          tournaments.map(tournament => (
            <ArchivedTournamentCard
              key={tournament.id}
              tournament={tournament}
            />
          ))
        ) : (
          <EmptyArchiveState />
        )}
      </div>
    </div>
  )
}
