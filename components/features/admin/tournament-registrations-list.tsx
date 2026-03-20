/**
 * File: components/features/admin/tournament-registrations-list.tsx
 * Description: Client component displaying tournament registrations with search, pagination, and clickable rows.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

'use client'

import { Ban, ChevronLeft, ChevronRight, Download, Search } from 'lucide-react'
import Image from 'next/image'
import { useMemo, useState } from 'react'
import { RegistrationDetailDialog } from '@/components/features/admin/registration-detail-dialog'
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
import type { RegistrationRow, TeamOption } from '@/lib/types/registration'
import type { TournamentRegistrationItem } from '@/lib/types/tournament'
import { isBanned } from '@/lib/utils/auth.helpers'
import { formatDateTime } from '@/lib/utils/formatting'
import type {
  FieldType,
  Role,
  TournamentFormat,
  TournamentStatus,
} from '@/prisma/generated/prisma/enums'

const PAGE_SIZE = 20

/** Tournament context needed to construct RegistrationRow for the dialog. */
interface TournamentContext {
  id: string
  title: string
  slug: string
  format: TournamentFormat
  status: TournamentStatus
  fields: {
    label: string
    type: FieldType
    required: boolean
    order: number
  }[]
}

interface TournamentRegistrationsListProps {
  registrations: TournamentRegistrationItem[]
  tournamentId: string
  tournamentContext: TournamentContext
  teamsByTournament: Record<string, TeamOption[]>
  viewerRole: Role
}

export const TournamentRegistrationsList = ({
  registrations,
  tournamentId,
  tournamentContext,
  teamsByTournament,
  viewerRole,
}: TournamentRegistrationsListProps) => {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [selectedRegistration, setSelectedRegistration] = useState<
    RegistrationRow | undefined
  >()

  const filtered = useMemo(() => {
    if (!search) return registrations
    const q = search.toLowerCase()
    return registrations.filter(
      r =>
        r.user.name.toLowerCase().includes(q) ||
        r.user.displayName.toLowerCase().includes(q) ||
        r.team?.name.toLowerCase().includes(q),
    )
  }, [registrations, search])

  const handleSearch = (value: string) => {
    setSearch(value)
    setPage(1)
  }

  // Convert a TournamentRegistrationItem to a RegistrationRow for the dialog
  const toRegistrationRow = (
    item: TournamentRegistrationItem,
  ): RegistrationRow => ({
    id: item.id,
    createdAt: item.createdAt,
    fieldValues: item.fieldValues,
    user: item.user,
    tournament: tournamentContext,
    team: item.team,
  })

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const paginated = filtered.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  )

  const handleExportCsv = () => {
    window.open(ROUTES.API_TOURNAMENT_EXPORT_CSV(tournamentId))
  }

  return (
    <>
      {/* Search + stats */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <div className="relative max-w-xs flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-zinc-500" />
            <Input
              placeholder="Rechercher une inscription..."
              aria-label="Rechercher une inscription"
              value={search}
              onChange={e => handleSearch(e.target.value)}
              className="border-white/10 bg-white/5 pl-9 text-zinc-200 placeholder:text-zinc-600"
            />
          </div>
          <Button
            aria-label="Exporter CSV"
            className="gap-2 bg-blue-600 text-white hover:bg-blue-500"
            onClick={handleExportCsv}
            disabled={registrations.length === 0}
          >
            <Download className="size-4" />
            <span className="hidden sm:inline">Exporter CSV</span>
          </Button>
        </div>
        <div className="flex items-center gap-3 text-xs text-zinc-500">
          <span>
            {filtered.length} inscription
            {filtered.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Registrations table */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-white/5 bg-white/2 p-8 text-center backdrop-blur-sm">
          <p className="text-sm text-zinc-500">
            {search
              ? 'Aucune inscription trouvée pour cette recherche.'
              : 'Aucune inscription pour le moment.'}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-white/5 bg-white/2 backdrop-blur-sm">
          <Table>
            <TableHeader>
              <TableRow className="border-white/5 hover:bg-transparent">
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Joueur
                </TableHead>
                <TableHead className="hidden text-xs font-semibold uppercase tracking-wider text-zinc-500 sm:table-cell">
                  Equipe
                </TableHead>
                <TableHead className="hidden text-xs font-semibold uppercase tracking-wider text-zinc-500 md:table-cell">
                  Date
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.map(registration => {
                const banned = isBanned(registration.user.bannedUntil)

                return (
                  <TableRow
                    key={registration.id}
                    tabIndex={0}
                    role="button"
                    className="cursor-pointer border-white/5 hover:bg-white/4"
                    onClick={() =>
                      setSelectedRegistration(toRegistrationRow(registration))
                    }
                    onKeyDown={e => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        setSelectedRegistration(toRegistrationRow(registration))
                      }
                    }}
                  >
                    {/* Player info */}
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="relative flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-white/5">
                          {registration.user.image ? (
                            <Image
                              src={registration.user.image}
                              alt={registration.user.name}
                              width={32}
                              height={32}
                              className="size-full object-cover"
                            />
                          ) : (
                            <span className="text-xs font-medium text-zinc-400">
                              {registration.user.name.charAt(0).toUpperCase()}
                            </span>
                          )}
                          {banned && (
                            <div className="absolute inset-0 flex items-center justify-center bg-red-500/20">
                              <Ban className="size-3.5 text-red-400" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-zinc-200">
                            {registration.user.displayName}
                          </p>
                          <p className="truncate text-xs text-zinc-500">
                            {registration.user.name}
                          </p>
                        </div>
                      </div>
                    </TableCell>

                    {/* Team */}
                    <TableCell className="hidden sm:table-cell">
                      {registration.team ? (
                        <span className="text-xs text-zinc-400">
                          {registration.team.name}
                        </span>
                      ) : (
                        <span className="text-xs text-zinc-600">&mdash;</span>
                      )}
                    </TableCell>

                    {/* Date */}
                    <TableCell className="hidden text-xs text-zinc-500 md:table-cell">
                      {formatDateTime(registration.createdAt)}
                    </TableCell>
                  </TableRow>
                )
              })}
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
              aria-label="Page precedente"
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

      {/* Registration detail dialog */}
      {selectedRegistration && (
        <RegistrationDetailDialog
          open={!!selectedRegistration}
          onOpenChange={open => {
            if (!open) setSelectedRegistration(undefined)
          }}
          registration={selectedRegistration}
          teamsByTournament={teamsByTournament}
          viewerRole={viewerRole}
        />
      )}
    </>
  )
}
