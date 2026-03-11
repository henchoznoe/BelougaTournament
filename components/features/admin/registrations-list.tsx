/**
 * File: components/features/admin/registrations-list.tsx
 * Description: Client component displaying all tournament registrations with search and filters.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

'use client'

import { Search, Trophy } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useMemo, useState } from 'react'
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
import {
  TOURNAMENT_STATUS_LABELS,
  TOURNAMENT_STATUS_STYLES,
} from '@/lib/config/constants'
import { ROUTES } from '@/lib/config/routes'
import type { RegistrationRow } from '@/lib/types/registration'
import { formatDateTime } from '@/lib/utils/formatting'
import {
  TournamentFormat,
  TournamentStatus,
} from '@/prisma/generated/prisma/enums'

type FormatFilter = 'all' | 'SOLO' | 'TEAM'
type StatusFilter = 'all' | TournamentStatus

interface RegistrationsListProps {
  registrations: RegistrationRow[]
}

export const RegistrationsList = ({
  registrations,
}: RegistrationsListProps) => {
  const [search, setSearch] = useState('')
  const [formatFilter, setFormatFilter] = useState<FormatFilter>('all')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')

  const filtered = useMemo(() => {
    let result = registrations

    // Format filter
    if (formatFilter === 'SOLO') {
      result = result.filter(r => r.tournament.format === TournamentFormat.SOLO)
    } else if (formatFilter === 'TEAM') {
      result = result.filter(r => r.tournament.format === TournamentFormat.TEAM)
    }

    // Tournament status filter
    if (statusFilter !== 'all') {
      result = result.filter(r => r.tournament.status === statusFilter)
    }

    // Search filter
    if (search) {
      const q = search.toLowerCase()
      result = result.filter(
        r =>
          r.user.name.toLowerCase().includes(q) ||
          r.user.displayName.toLowerCase().includes(q) ||
          r.tournament.title.toLowerCase().includes(q) ||
          r.team?.name.toLowerCase().includes(q),
      )
    }

    return result
  }, [registrations, search, formatFilter, statusFilter])

  return (
    <>
      {/* Search + filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-xs flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-zinc-500" />
          <Input
            placeholder="Rechercher..."
            aria-label="Rechercher une inscription"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="border-white/10 bg-white/5 pl-9 text-zinc-200 placeholder:text-zinc-600"
          />
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={formatFilter}
            onValueChange={v => setFormatFilter(v as FormatFilter)}
          >
            <SelectTrigger className="w-28 border-white/10 bg-white/5 text-zinc-200">
              <SelectValue placeholder="Format" />
            </SelectTrigger>
            <SelectContent className="border-white/10 bg-zinc-950">
              <SelectItem value="all">Tous</SelectItem>
              <SelectItem value="SOLO">Solo</SelectItem>
              <SelectItem value="TEAM">Équipe</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={statusFilter}
            onValueChange={v => setStatusFilter(v as StatusFilter)}
          >
            <SelectTrigger className="w-32 border-white/10 bg-white/5 text-zinc-200">
              <SelectValue placeholder="Statut tournoi" />
            </SelectTrigger>
            <SelectContent className="border-white/10 bg-zinc-950">
              <SelectItem value="all">Tous</SelectItem>
              <SelectItem value={TournamentStatus.PUBLISHED}>Publié</SelectItem>
              <SelectItem value={TournamentStatus.DRAFT}>Brouillon</SelectItem>
              <SelectItem value={TournamentStatus.ARCHIVED}>Archivé</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 text-xs text-zinc-500">
        <span>
          {filtered.length} inscription{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-white/5 bg-white/2 p-8 text-center backdrop-blur-sm">
          <p className="text-sm text-zinc-500">
            {search || formatFilter !== 'all' || statusFilter !== 'all'
              ? 'Aucune inscription trouvée pour ces critères.'
              : 'Aucune inscription.'}
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-white/5 bg-white/2 backdrop-blur-sm">
          <Table>
            <TableHeader>
              <TableRow className="border-white/5 hover:bg-transparent">
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Joueur
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Tournoi
                </TableHead>
                <TableHead className="hidden text-xs font-semibold uppercase tracking-wider text-zinc-500 sm:table-cell">
                  Équipe
                </TableHead>
                <TableHead className="hidden text-xs font-semibold uppercase tracking-wider text-zinc-500 md:table-cell">
                  Statut
                </TableHead>
                <TableHead className="hidden text-xs font-semibold uppercase tracking-wider text-zinc-500 lg:table-cell">
                  Date
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(reg => {
                const statusLabel =
                  TOURNAMENT_STATUS_LABELS[reg.tournament.status] ??
                  reg.tournament.status
                const statusClassName =
                  TOURNAMENT_STATUS_STYLES[reg.tournament.status] ??
                  'bg-zinc-500/10 text-zinc-400'

                return (
                  <TableRow
                    key={reg.id}
                    className="border-white/5 hover:bg-white/2"
                  >
                    {/* Player */}
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="relative flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-white/5">
                          {reg.user.image ? (
                            <Image
                              src={reg.user.image}
                              alt={reg.user.name}
                              width={32}
                              height={32}
                              className="size-full object-cover"
                            />
                          ) : (
                            <span className="text-xs font-medium text-zinc-400">
                              {reg.user.name.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-zinc-200">
                            {reg.user.displayName}
                          </p>
                          <p className="truncate text-xs text-zinc-500">
                            {reg.user.name}
                          </p>
                        </div>
                      </div>
                    </TableCell>

                    {/* Tournament */}
                    <TableCell>
                      <Link
                        href={ROUTES.ADMIN_TOURNAMENT_REGISTRATIONS(
                          reg.tournament.slug,
                        )}
                        className="inline-flex items-center gap-1.5 text-sm text-zinc-300 hover:text-white"
                      >
                        <Trophy className="size-3 shrink-0 text-zinc-500" />
                        <span className="truncate">{reg.tournament.title}</span>
                      </Link>
                    </TableCell>

                    {/* Team */}
                    <TableCell className="hidden sm:table-cell">
                      {reg.team ? (
                        <span className="text-sm text-zinc-300">
                          {reg.team.name}
                        </span>
                      ) : (
                        <span className="text-xs text-zinc-600">—</span>
                      )}
                    </TableCell>

                    {/* Tournament status */}
                    <TableCell className="hidden md:table-cell">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusClassName}`}
                      >
                        {statusLabel}
                      </span>
                    </TableCell>

                    {/* Date */}
                    <TableCell className="hidden text-xs text-zinc-500 lg:table-cell">
                      {formatDateTime(reg.createdAt)}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </>
  )
}
