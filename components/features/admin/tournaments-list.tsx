/**
 * File: components/features/admin/tournaments-list.tsx
 * Description: Client component displaying the tournaments table with search, status filter, sortable columns, and pagination.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

'use client'

import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Plus,
  Search,
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import { TournamentActionsDropdown } from '@/components/features/admin/tournament-actions-dropdown'
import { TournamentStatusBadge } from '@/components/features/admin/tournament-status-badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
  RegistrationType,
  TournamentFormat,
  TournamentStatus,
} from '@/prisma/generated/prisma/enums'

const PAGE_SIZE = 10

const FORMAT_LABELS = {
  [TournamentFormat.SOLO]: 'Solo',
  [TournamentFormat.TEAM]: 'Équipe',
} as const

type StatusFilter = 'all' | TournamentStatus
type SortKey =
  | 'title'
  | 'format'
  | 'registrationType'
  | 'startDate'
  | 'registrations'
  | 'status'
type SortDirection = 'asc' | 'desc'

interface SortState {
  key: SortKey | null
  direction: SortDirection
}

interface TournamentsListProps {
  tournaments: TournamentListItem[]
}

/** Default sort: most recent start date first. */
const defaultSort = (a: TournamentListItem, b: TournamentListItem): number => {
  return new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
}

const STATUS_ORDER: Record<TournamentStatus, number> = {
  [TournamentStatus.DRAFT]: 0,
  [TournamentStatus.PUBLISHED]: 1,
  [TournamentStatus.ARCHIVED]: 2,
} as const

const compareValues = (
  a: TournamentListItem,
  b: TournamentListItem,
  key: SortKey,
): number => {
  switch (key) {
    case 'title':
      return a.title.localeCompare(b.title)
    case 'format': {
      const aLabel = FORMAT_LABELS[a.format]
      const bLabel = FORMAT_LABELS[b.format]
      return aLabel.localeCompare(bLabel)
    }
    case 'registrationType': {
      const aVal = a.registrationType === RegistrationType.PAID ? 1 : 0
      const bVal = b.registrationType === RegistrationType.PAID ? 1 : 0
      return aVal - bVal
    }
    case 'startDate':
      return new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    case 'registrations':
      return a._count.registrations - b._count.registrations
    case 'status':
      return STATUS_ORDER[a.status] - STATUS_ORDER[b.status]
    default:
      return 0
  }
}

const formatRegistrationType = (t: TournamentListItem): string => {
  if (t.registrationType === RegistrationType.FREE) return 'Gratuit'
  const amount = t.entryFeeAmount ? (t.entryFeeAmount / 100).toString() : '?'
  const currency = t.entryFeeCurrency ?? ''
  return `Payant (${amount} ${currency})`.trim()
}

export const TournamentsList = ({ tournaments }: TournamentsListProps) => {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [page, setPage] = useState(1)
  const [sort, setSort] = useState<SortState>({ key: null, direction: 'asc' })

  const handleSort = (key: SortKey) => {
    setSort(prev => {
      if (prev.key !== key) return { key, direction: 'asc' }
      if (prev.direction === 'asc') return { key, direction: 'desc' }
      return { key: null, direction: 'asc' }
    })
    setPage(1)
  }

  const SortIndicator = ({ columnKey }: { columnKey: SortKey }) => {
    if (sort.key !== columnKey) return null
    return sort.direction === 'asc' ? (
      <ChevronUp className="inline size-3" />
    ) : (
      <ChevronDown className="inline size-3" />
    )
  }

  const filtered = useMemo(() => {
    let result = tournaments

    if (statusFilter !== 'all') {
      result = result.filter(t => t.status === statusFilter)
    }

    if (search) {
      const q = search.toLowerCase()
      result = result.filter(
        t =>
          t.title.toLowerCase().includes(q) ||
          t.slug.toLowerCase().includes(q) ||
          t.game?.toLowerCase().includes(q),
      )
    }

    const sorted = [...result]
    if (sort.key) {
      const key = sort.key
      const dir = sort.direction === 'asc' ? 1 : -1
      sorted.sort((a, b) => compareValues(a, b, key) * dir)
    } else {
      sorted.sort(defaultSort)
    }

    return sorted
  }, [tournaments, search, statusFilter, sort])

  const handleSearch = (value: string) => {
    setSearch(value)
    setPage(1)
  }

  const handleStatusFilter = (value: string) => {
    setStatusFilter(value as StatusFilter)
    setPage(1)
  }

  const draftCount = tournaments.filter(
    t => t.status === TournamentStatus.DRAFT,
  ).length
  const publishedCount = tournaments.filter(
    t => t.status === TournamentStatus.PUBLISHED,
  ).length
  const archivedCount = tournaments.filter(
    t => t.status === TournamentStatus.ARCHIVED,
  ).length

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const paginated = filtered.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  )

  return (
    <>
      {/* Search + status filter + create button */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <div className="relative max-w-xs flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-zinc-500" />
            <Input
              placeholder="Rechercher un tournoi..."
              aria-label="Rechercher un tournoi"
              value={search}
              onChange={e => handleSearch(e.target.value)}
              className="border-white/10 bg-white/5 pl-9 text-zinc-200 placeholder:text-zinc-600"
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Select value={statusFilter} onValueChange={handleStatusFilter}>
            <SelectTrigger
              aria-label="Filtrer par statut"
              className="w-28 border-white/10 bg-white/5 text-zinc-200"
            >
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent className="border-white/10 bg-zinc-950">
              <SelectItem value="all">Tous</SelectItem>
              <SelectItem value={TournamentStatus.DRAFT}>Brouillon</SelectItem>
              <SelectItem value={TournamentStatus.PUBLISHED}>Publié</SelectItem>
              <SelectItem value={TournamentStatus.ARCHIVED}>Archivé</SelectItem>
            </SelectContent>
          </Select>
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

      {/* Stats line */}
      <div className="flex items-center gap-3 text-xs text-zinc-500">
        <span className="mr-2">
          {tournaments.length} tournoi{tournaments.length !== 1 ? 's' : ''}
        </span>

        <span className="text-amber-400">
          {draftCount} brouillon{draftCount !== 1 ? 's' : ''}
        </span>

        <span className="text-emerald-400">
          {publishedCount} publié{publishedCount !== 1 ? 's' : ''}
        </span>

        <span className="text-zinc-400">
          {archivedCount} archivé{archivedCount !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Table or empty state */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-white/5 bg-white/2 p-8 text-center backdrop-blur-sm">
          <p className="text-sm text-zinc-500">
            {search || statusFilter !== 'all'
              ? 'Aucun tournoi trouvé pour ces critères.'
              : 'Aucun tournoi pour le moment.'}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-white/5 bg-white/2 backdrop-blur-sm">
          <Table>
            <TableHeader>
              <TableRow className="border-white/5 hover:bg-transparent">
                <TableHead
                  className="cursor-pointer select-none text-xs font-semibold uppercase tracking-wider text-zinc-500 hover:text-zinc-300"
                  onClick={() => handleSort('title')}
                >
                  Tournoi <SortIndicator columnKey="title" />
                </TableHead>
                <TableHead
                  className="hidden cursor-pointer select-none text-xs font-semibold uppercase tracking-wider text-zinc-500 hover:text-zinc-300 sm:table-cell"
                  onClick={() => handleSort('format')}
                >
                  Format <SortIndicator columnKey="format" />
                </TableHead>
                <TableHead
                  className="hidden cursor-pointer select-none text-xs font-semibold uppercase tracking-wider text-zinc-500 hover:text-zinc-300 md:table-cell"
                  onClick={() => handleSort('registrationType')}
                >
                  Type <SortIndicator columnKey="registrationType" />
                </TableHead>
                <TableHead
                  className="hidden cursor-pointer select-none text-xs font-semibold uppercase tracking-wider text-zinc-500 hover:text-zinc-300 md:table-cell"
                  onClick={() => handleSort('startDate')}
                >
                  Date de début <SortIndicator columnKey="startDate" />
                </TableHead>
                <TableHead
                  className="hidden cursor-pointer select-none text-center text-xs font-semibold uppercase tracking-wider text-zinc-500 hover:text-zinc-300 lg:table-cell"
                  onClick={() => handleSort('registrations')}
                >
                  Inscriptions <SortIndicator columnKey="registrations" />
                </TableHead>
                <TableHead
                  className="cursor-pointer select-none text-xs font-semibold uppercase tracking-wider text-zinc-500 hover:text-zinc-300"
                  onClick={() => handleSort('status')}
                >
                  Statut <SortIndicator columnKey="status" />
                </TableHead>
                <TableHead className="w-10 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.map(tournament => (
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

                  {/* Registration type */}
                  <TableCell className="hidden md:table-cell">
                    <span className="text-xs text-zinc-400">
                      {formatRegistrationType(tournament)}
                    </span>
                  </TableCell>

                  {/* Start date */}
                  <TableCell className="hidden md:table-cell">
                    <span className="text-xs text-zinc-400">
                      {formatShortDate(tournament.startDate)}
                    </span>
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-zinc-500">
            {(safePage - 1) * PAGE_SIZE + 1}&ndash;
            {Math.min(safePage * PAGE_SIZE, filtered.length)} sur{' '}
            {filtered.length}
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              disabled={safePage <= 1}
              onClick={() => setPage(p => p - 1)}
              aria-label="Page précédente"
              className="text-zinc-400"
            >
              <ChevronLeft className="size-4" />
            </Button>
            <span className="px-2 text-xs text-zinc-400">
              {safePage} / {totalPages}
            </span>
            <Button
              variant="ghost"
              size="icon-sm"
              disabled={safePage >= totalPages}
              onClick={() => setPage(p => p + 1)}
              aria-label="Page suivante"
              className="text-zinc-400"
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      )}
    </>
  )
}
