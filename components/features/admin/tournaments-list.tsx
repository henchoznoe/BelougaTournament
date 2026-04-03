/**
 * File: components/features/admin/tournaments-list.tsx
 * Description: Client component displaying the tournaments table with clickable rows and actions dropdown.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

'use client'

import { Plus, Search } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import { TournamentActionsDropdown } from '@/components/features/admin/tournament-actions-dropdown'
import { TournamentStatusBadge } from '@/components/features/admin/tournament-status-badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ROUTES } from '@/lib/config/routes'
import type { TournamentListItem } from '@/lib/types/tournament'
import { formatShortDate } from '@/lib/utils/formatting'
import {
  TournamentFormat,
  TournamentStatus,
} from '@/prisma/generated/prisma/enums'

const FORMAT_LABELS = {
  [TournamentFormat.SOLO]: 'Solo',
  [TournamentFormat.TEAM]: 'Équipe',
} as const

interface TournamentsListProps {
  tournaments: TournamentListItem[]
}

export const TournamentsList = ({ tournaments }: TournamentsListProps) => {
  const [search, setSearch] = useState('')
  const router = useRouter()

  const filtered = useMemo(() => {
    if (!search) return tournaments
    const q = search.toLowerCase()
    return tournaments.filter(
      t =>
        t.title.toLowerCase().includes(q) ||
        t.slug.toLowerCase().includes(q) ||
        t.game?.toLowerCase().includes(q),
    )
  }, [tournaments, search])

  const statusCount = (status: TournamentStatus) =>
    tournaments.filter(t => t.status === status).length

  return (
    <>
      {/* Search + stats + add button */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-xs flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-zinc-500" />
          <Input
            placeholder="Rechercher un tournoi..."
            aria-label="Rechercher un tournoi"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="border-white/10 bg-white/5 pl-9 text-zinc-200 placeholder:text-zinc-600"
          />
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 text-xs text-zinc-500">
            <span>
              {tournaments.length} tournoi{tournaments.length !== 1 ? 's' : ''}
            </span>
            {statusCount(TournamentStatus.PUBLISHED) > 0 && (
              <span className="text-emerald-400">
                {statusCount(TournamentStatus.PUBLISHED)} publié
                {statusCount(TournamentStatus.PUBLISHED) !== 1 ? 's' : ''}
              </span>
            )}
            {statusCount(TournamentStatus.DRAFT) > 0 && (
              <span className="text-amber-400">
                {statusCount(TournamentStatus.DRAFT)} brouillon
                {statusCount(TournamentStatus.DRAFT) !== 1 ? 's' : ''}
              </span>
            )}
          </div>
          <Button
            asChild
            className="gap-2 bg-blue-600 text-white hover:bg-blue-500"
          >
            <Link href={ROUTES.ADMIN_NEW_TOURNAMENT}>
              <Plus className="size-4" />
              Créer
            </Link>
          </Button>
        </div>
      </div>

      {/* Tournaments table */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-white/5 bg-white/2 p-8 text-center backdrop-blur-sm">
          <p className="text-sm text-zinc-500">
            {search
              ? 'Aucun tournoi trouvé pour cette recherche.'
              : 'Aucun tournoi pour le moment.'}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-white/5 bg-white/2 backdrop-blur-sm">
          <Table>
            <TableHeader>
              <TableRow className="border-white/5 hover:bg-transparent">
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Tournoi
                </TableHead>
                <TableHead className="hidden text-xs font-semibold uppercase tracking-wider text-zinc-500 sm:table-cell">
                  Format
                </TableHead>
                <TableHead className="hidden text-xs font-semibold uppercase tracking-wider text-zinc-500 md:table-cell">
                  Dates
                </TableHead>
                <TableHead className="hidden text-center text-xs font-semibold uppercase tracking-wider text-zinc-500 lg:table-cell">
                  Inscriptions
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Statut
                </TableHead>
                <TableHead className="w-10 text-right text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(tournament => (
                <TableRow
                  key={tournament.id}
                  tabIndex={0}
                  role="link"
                  className="cursor-pointer border-white/5 hover:bg-white/4"
                  onClick={() =>
                    router.push(ROUTES.ADMIN_TOURNAMENT_DETAIL(tournament.slug))
                  }
                  onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      router.push(
                        ROUTES.ADMIN_TOURNAMENT_DETAIL(tournament.slug),
                      )
                    }
                  }}
                >
                  {/* Title & game */}
                  <TableCell>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-zinc-200">
                        {tournament.title}
                      </p>
                      {tournament.game && (
                        <p className="truncate text-xs text-zinc-500">
                          {tournament.game}
                        </p>
                      )}
                    </div>
                  </TableCell>

                  {/* Format */}
                  <TableCell className="hidden sm:table-cell">
                    <span className="text-xs text-zinc-400">
                      {FORMAT_LABELS[tournament.format]}
                      {tournament.format === TournamentFormat.TEAM &&
                        ` (${tournament.teamSize.toString()})`}
                    </span>
                  </TableCell>

                  {/* Dates */}
                  <TableCell className="hidden md:table-cell">
                    <div className="text-xs text-zinc-400">
                      <p>{formatShortDate(tournament.startDate)}</p>
                      <p className="text-zinc-600">
                        {formatShortDate(tournament.endDate)}
                      </p>
                    </div>
                  </TableCell>

                  {/* Registration count */}
                  <TableCell className="hidden text-center lg:table-cell">
                    <span className="text-xs text-zinc-400">
                      {tournament._count.registrations.toString()}
                      {tournament.maxTeams &&
                        ` / ${tournament.maxTeams.toString()}`}
                    </span>
                  </TableCell>

                  {/* Status */}
                  <TableCell>
                    <TournamentStatusBadge status={tournament.status} />
                  </TableCell>

                  {/* Actions */}
                  <TableCell onClick={e => e.stopPropagation()}>
                    <TournamentActionsDropdown tournament={tournament} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </>
  )
}
