/**
 * File: components/features/admin/tournaments-list.tsx
 * Description: Client component displaying the tournaments table with CRUD and status actions.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

'use client'

import { Pencil, Plus, Search, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMemo, useState, useTransition } from 'react'
import { toast } from 'sonner'
import { TournamentDeleteDialog } from '@/components/features/admin/tournament-delete-dialog'
import { TournamentStatusBadge } from '@/components/features/admin/tournament-status-badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { updateTournamentStatus } from '@/lib/actions/tournaments'
import { ROUTES } from '@/lib/config/routes'
import type { TournamentListItem } from '@/lib/types/tournament'
import { formatShortDate } from '@/lib/utils/formatting'
import type { TournamentStatus } from '@/prisma/generated/prisma/enums'

const FORMAT_LABELS = {
  SOLO: 'Solo',
  TEAM: 'Équipe',
} as const

interface TournamentsListProps {
  tournaments: TournamentListItem[]
}

export const TournamentsList = ({ tournaments }: TournamentsListProps) => {
  const [search, setSearch] = useState('')
  const [deletingTournament, setDeletingTournament] = useState<
    TournamentListItem | undefined
  >()
  const [isPending, startTransition] = useTransition()
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

  const handleStatusChange = (
    tournament: TournamentListItem,
    newStatus: TournamentStatus,
  ) => {
    if (newStatus === tournament.status) return
    startTransition(async () => {
      const result = await updateTournamentStatus({
        id: tournament.id,
        status: newStatus,
      })
      if (result.success) {
        toast.success(result.message)
        router.refresh()
      } else {
        toast.error(result.message ?? 'Une erreur est survenue.')
      }
    })
  }

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
            {statusCount('PUBLISHED') > 0 && (
              <span className="text-emerald-400">
                {statusCount('PUBLISHED')} publié
                {statusCount('PUBLISHED') !== 1 ? 's' : ''}
              </span>
            )}
            {statusCount('DRAFT') > 0 && (
              <span className="text-amber-400">
                {statusCount('DRAFT')} brouillon
                {statusCount('DRAFT') !== 1 ? 's' : ''}
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
        <div className="rounded-2xl border border-white/5 bg-white/2 backdrop-blur-sm">
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
                <TableHead className="text-right text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(tournament => (
                <TableRow
                  key={tournament.id}
                  className="border-white/5 hover:bg-white/2"
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
                      {tournament.format === 'TEAM' &&
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
                    <Select
                      value={tournament.status}
                      onValueChange={val =>
                        handleStatusChange(tournament, val as TournamentStatus)
                      }
                      disabled={isPending}
                    >
                      <SelectTrigger className="h-7 w-auto gap-1.5 rounded-full border-none bg-transparent p-0 shadow-none">
                        <TournamentStatusBadge status={tournament.status} />
                      </SelectTrigger>
                      <SelectContent position="popper" sideOffset={4}>
                        <SelectItem value="DRAFT">Brouillon</SelectItem>
                        <SelectItem value="PUBLISHED">Publié</SelectItem>
                        <SelectItem value="ARCHIVED">Archivé</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>

                  {/* Actions */}
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        asChild
                        className="text-zinc-400 hover:text-white"
                      >
                        <Link
                          href={`${ROUTES.ADMIN_TOURNAMENTS}/${tournament.slug}`}
                          aria-label="Modifier"
                        >
                          <Pencil className="size-4" />
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setDeletingTournament(tournament)}
                        className="text-zinc-400 hover:text-red-400"
                        aria-label="Supprimer"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Delete confirmation dialog */}
      {deletingTournament && (
        <TournamentDeleteDialog
          open={!!deletingTournament}
          onOpenChange={open => {
            if (!open) setDeletingTournament(undefined)
          }}
          tournament={deletingTournament}
        />
      )}
    </>
  )
}
