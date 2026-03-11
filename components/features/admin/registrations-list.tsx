/**
 * File: components/features/admin/registrations-list.tsx
 * Description: Client component displaying all tournament registrations with search, filters, pagination, and clickable rows.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

'use client'

import {
  Ban,
  ChevronLeft,
  ChevronRight,
  Search,
  Trophy,
  Users,
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { RegistrationDetailDialog } from '@/components/features/admin/registration-detail-dialog'
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
import type { RegistrationRow, TeamOption } from '@/lib/types/registration'
import { isBanned } from '@/lib/utils/auth.helpers'
import { formatDateTime } from '@/lib/utils/formatting'
import type { Role } from '@/prisma/generated/prisma/enums'
import { TournamentFormat } from '@/prisma/generated/prisma/enums'

const PAGE_SIZE = 20

type FormatFilter = 'all' | 'SOLO' | 'TEAM'

interface RegistrationsListProps {
  registrations: RegistrationRow[]
  teamsByTournament: Record<string, TeamOption[]>
  viewerRole: Role
}

export const RegistrationsList = ({
  registrations,
  teamsByTournament,
  viewerRole,
}: RegistrationsListProps) => {
  const searchParams = useSearchParams()
  const [search, setSearch] = useState('')
  const [formatFilter, setFormatFilter] = useState<FormatFilter>('all')
  const [tournamentFilter, setTournamentFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [selectedRegistration, setSelectedRegistration] = useState<
    RegistrationRow | undefined
  >()

  // Deep-link: auto-open dialog when ?registrationId=xxx is present
  useEffect(() => {
    const registrationId = searchParams.get('registrationId')
    if (registrationId && !selectedRegistration) {
      const match = registrations.find(r => r.id === registrationId)
      if (match) {
        setSelectedRegistration(match)
      }
      // Clear the search param so closing the dialog does not re-trigger the effect
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [searchParams, registrations, selectedRegistration])

  // Derive unique tournaments for the tournament dropdown
  const tournaments = useMemo(() => {
    const seen = new Map<string, string>()
    for (const r of registrations) {
      if (!seen.has(r.tournament.id)) {
        seen.set(r.tournament.id, r.tournament.title)
      }
    }
    return [...seen.entries()]
      .map(([id, title]) => ({ id, title }))
      .sort((a, b) => a.title.localeCompare(b.title))
  }, [registrations])

  const filtered = useMemo(() => {
    let result = registrations

    // Format filter
    if (formatFilter === 'SOLO') {
      result = result.filter(r => r.tournament.format === TournamentFormat.SOLO)
    } else if (formatFilter === 'TEAM') {
      result = result.filter(r => r.tournament.format === TournamentFormat.TEAM)
    }

    // Tournament filter
    if (tournamentFilter !== 'all') {
      result = result.filter(r => r.tournament.id === tournamentFilter)
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
  }, [registrations, search, formatFilter, tournamentFilter])

  // Reset to page 1 when filters change
  const handleSearch = (value: string) => {
    setSearch(value)
    setPage(1)
  }

  const handleFormatFilter = (value: string) => {
    setFormatFilter(value as FormatFilter)
    setPage(1)
  }

  const handleTournamentFilter = (value: string) => {
    setTournamentFilter(value)
    setPage(1)
  }

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const paginated = filtered.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  )

  // Stats
  const teamCount = registrations.filter(
    r => r.tournament.format === TournamentFormat.TEAM,
  ).length

  return (
    <>
      {/* Search + filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
        <div className="flex items-center gap-2">
          <Select value={formatFilter} onValueChange={handleFormatFilter}>
            <SelectTrigger className="w-28 border-white/10 bg-white/5 text-zinc-200">
              <SelectValue placeholder="Format" />
            </SelectTrigger>
            <SelectContent className="border-white/10 bg-zinc-950">
              <SelectItem value="all">Tous</SelectItem>
              <SelectItem value="SOLO">Solo</SelectItem>
              <SelectItem value="TEAM">Equipe</SelectItem>
            </SelectContent>
          </Select>
          {tournaments.length > 1 && (
            <Select
              value={tournamentFilter}
              onValueChange={handleTournamentFilter}
            >
              <SelectTrigger className="w-44 border-white/10 bg-white/5 text-zinc-200">
                <SelectValue placeholder="Tournoi" />
              </SelectTrigger>
              <SelectContent className="border-white/10 bg-zinc-950">
                <SelectItem value="all">Tous les tournois</SelectItem>
                {tournaments.map(t => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 text-xs text-zinc-500">
        <span>
          {filtered.length} inscription{filtered.length !== 1 ? 's' : ''}
        </span>
        {teamCount > 0 && (
          <span className="text-blue-400">{teamCount} en equipe</span>
        )}
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-white/5 bg-white/2 p-8 text-center backdrop-blur-sm">
          <p className="text-sm text-zinc-500">
            {search || formatFilter !== 'all' || tournamentFilter !== 'all'
              ? 'Aucune inscription trouvee pour ces criteres.'
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
                  Equipe
                </TableHead>
                <TableHead className="hidden text-xs font-semibold uppercase tracking-wider text-zinc-500 lg:table-cell">
                  Date
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.map(reg => {
                const banned = isBanned(reg.user.bannedUntil)

                return (
                  <TableRow
                    key={reg.id}
                    className="cursor-pointer border-white/5 hover:bg-white/4"
                    onClick={() => setSelectedRegistration(reg)}
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
                          {banned && (
                            <div className="absolute inset-0 flex items-center justify-center bg-red-500/20">
                              <Ban className="size-3.5 text-red-400" />
                            </div>
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
                        href={ROUTES.ADMIN_EDIT_TOURNAMENT(reg.tournament.slug)}
                        onClick={e => e.stopPropagation()}
                        className="inline-flex items-center gap-1.5 text-sm text-zinc-300 hover:text-blue-400"
                      >
                        <Trophy className="size-3 shrink-0 text-zinc-500" />
                        <span className="truncate">{reg.tournament.title}</span>
                      </Link>
                    </TableCell>

                    {/* Team */}
                    <TableCell className="hidden sm:table-cell">
                      {reg.team ? (
                        <span className="inline-flex items-center gap-1 text-sm text-zinc-300">
                          <Users className="size-3 text-zinc-500" />
                          {reg.team.name}
                        </span>
                      ) : (
                        <span className="text-xs text-zinc-600">&mdash;</span>
                      )}
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
