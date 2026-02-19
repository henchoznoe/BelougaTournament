/**
 * File: app/admin/tournaments/page.tsx
 * Description: List of all tournaments with management actions.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { Edit, Eye, Plus, Trophy } from 'lucide-react'
import Link from 'next/link'
import { DeleteTournamentButton } from '@/components/features/tournament/actions/delete-button'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { APP_ROUTES } from '@/lib/config/routes'
import { getAdminTournaments } from '@/lib/services/tournament.service'
import { formatDate } from '@/lib/utils'
import { Visibility } from '@/prisma/generated/prisma/client'

const CONFIG = {
  DEFAULT_MAX_PARTICIPANTS: 100,
} as const

/**
 * Calculates the completion percentage of registrations.
 */
const getRegistrationProgress = (
  current: number,
  max: number | null,
): number => {
  const maxParticipants = max || CONFIG.DEFAULT_MAX_PARTICIPANTS
  return Math.min(100, (current / maxParticipants) * 100)
}

/**
 * Determines if a tournament is finished based on the current date.
 */
const isTournamentOver = (endDate: Date, now: Date): boolean => {
  return now > new Date(endDate)
}

/**
 * Determines if a tournament is currently public and active.
 */
const isPublicActive = (
  visibility: Visibility,
  endDate: Date,
  now: Date,
): boolean => {
  return visibility === Visibility.PUBLIC && now <= new Date(endDate)
}

// ----------------------------------------------------------------------
// COMPONENT
// ----------------------------------------------------------------------

const TournamentsPage = async () => {
  const tournaments = await getAdminTournaments()
  // Performance: Instantiate 'now' once for all comparisons
  const now = new Date()

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tighter text-white mb-2">
            Tournaments
          </h1>
          <p className="text-zinc-400">Manage all tournaments</p>
        </div>
        <Button
          asChild
          size="lg"
          className="bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20"
        >
          <Link href={APP_ROUTES.ADMIN_NEW_TOURNAMENT}>
            <Plus className="mr-2 h-5 w-5" />
            Create tournament
          </Link>
        </Button>
      </div>

      {/* Table Section */}
      <div className="rounded-xl border border-white/10 bg-zinc-900/50 backdrop-blur-xl overflow-hidden shadow-xl">
        <Table>
          <TableHeader>
            <TableRow className="border-white/10 bg-white/5 hover:bg-white/5">
              <TableHead className="text-zinc-400 font-medium uppercase tracking-wider text-xs py-4 pl-6">
                Title
              </TableHead>
              <TableHead className="text-zinc-400 font-medium uppercase tracking-wider text-xs py-4">
                Date
              </TableHead>
              <TableHead className="text-zinc-400 font-medium uppercase tracking-wider text-xs py-4">
                Format
              </TableHead>
              <TableHead className="text-zinc-400 font-medium uppercase tracking-wider text-xs py-4">
                Registrations
              </TableHead>
              <TableHead className="text-right text-zinc-400 font-medium uppercase tracking-wider text-xs py-4 pr-6">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tournaments.length > 0 ? (
              tournaments.map(tournament => {
                const isOver = isTournamentOver(tournament.endDate, now)
                const isPublic = isPublicActive(
                  tournament.visibility,
                  tournament.endDate,
                  now,
                )
                const progress = getRegistrationProgress(
                  tournament._count.registrations,
                  tournament.maxParticipants,
                )

                return (
                  <TableRow
                    key={tournament.id}
                    className="border-white/5 hover:bg-white/5 transition-colors group"
                  >
                    <TableCell className="font-medium text-white py-4 pl-6">
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-3">
                          <div className="size-8 rounded bg-zinc-800 flex items-center justify-center text-zinc-400 group-hover:bg-blue-500/10 group-hover:text-blue-400 transition-colors">
                            <Trophy className="size-4" />
                          </div>
                          {tournament.title}
                        </div>
                        <div className="flex gap-2 ml-11">
                          {isOver && (
                            <Badge
                              variant="secondary"
                              className="bg-zinc-800 text-zinc-500 border-zinc-700 text-[10px] h-5 px-1.5"
                            >
                              Finished
                            </Badge>
                          )}
                          {tournament.visibility === Visibility.PRIVATE && (
                            <Badge
                              variant="outline"
                              className="border-zinc-700 text-zinc-500 text-[10px] h-5 px-1.5"
                            >
                              Private
                            </Badge>
                          )}
                          {isPublic && (
                            <Badge className="bg-green-500/10 text-green-400 border-green-500/20 text-[10px] h-5 px-1.5 hover:bg-green-500/20">
                              Public
                            </Badge>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-zinc-300 py-4">
                      {formatDate(tournament.startDate)}
                    </TableCell>
                    <TableCell className="text-zinc-300 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-800 text-zinc-300 border border-zinc-700">
                        {tournament.format}
                      </span>
                    </TableCell>
                    <TableCell className="text-zinc-300 py-4">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-24 bg-zinc-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-500 rounded-full"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <span className="text-xs">
                          {tournament._count.registrations}
                          {tournament.maxParticipants
                            ? ` / ${tournament.maxParticipants}`
                            : ''}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right py-4 pr-6">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          asChild
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-zinc-400 hover:text-blue-400 hover:bg-blue-500/10"
                        >
                          <Link
                            href={`${APP_ROUTES.ADMIN_TOURNAMENTS}/${tournament.id}`}
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button
                          asChild
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-zinc-400 hover:text-white hover:bg-white/10"
                        >
                          <Link
                            href={`${APP_ROUTES.ADMIN_TOURNAMENTS}/${tournament.id}/edit`}
                          >
                            <Edit className="h-4 w-4" />
                          </Link>
                        </Button>
                        <DeleteTournamentButton id={tournament.id} />
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })
            ) : (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="h-32 text-center text-zinc-500"
                >
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Trophy className="h-8 w-8 text-zinc-700" />
                    <p>There are no tournaments yet.</p>
                    <Button variant="link" asChild className="text-blue-500">
                      <Link href={APP_ROUTES.ADMIN_NEW_TOURNAMENT}>
                        Create tournament
                      </Link>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

export default TournamentsPage
