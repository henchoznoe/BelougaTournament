/**
 * File: components/admin/tournaments/tournament-registrations.tsx
 * Description: Admin registrations table with filters, pagination, and expandable field values.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

'use client'

import { CreditCard, Search } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import { useClientPagination } from '@/components/admin/hooks/use-client-pagination'
import { RegistrationRow } from '@/components/admin/tournaments/tournament-registration-row'
import { AdminPagination } from '@/components/admin/ui/admin-pagination'
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
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ADMIN_PAGE_SIZES } from '@/lib/config/constants'
import type {
  TeamItem,
  TournamentDetail,
  TournamentRegistrationItem,
} from '@/lib/types/tournament'
import { parseFieldValues } from '@/lib/utils/tournament-helpers'
import {
  PaymentStatus,
  RegistrationStatus,
  RegistrationType,
  TournamentFormat,
} from '@/prisma/generated/prisma/enums'

// ─── Constants ───────────────────────────────────────────────────────────────

const PAGE_SIZE = ADMIN_PAGE_SIZES.REGISTRATIONS

// ─── Main Component ──────────────────────────────────────────────────────────

interface TournamentRegistrationsProps {
  tournament: TournamentDetail
  registrations: TournamentRegistrationItem[]
  teams: TeamItem[]
}

export const TournamentRegistrations = ({
  tournament,
  registrations,
  teams,
}: TournamentRegistrationsProps) => {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [paymentFilter, setPaymentFilter] = useState<string>('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const { paginate, resetPage } =
    useClientPagination<TournamentRegistrationItem>(PAGE_SIZE)

  const isTeam = tournament.format === TournamentFormat.TEAM
  const isPaid = tournament.registrationType === RegistrationType.PAID
  const fields = tournament.fields

  // Filter registrations
  const filtered = useMemo(() => {
    let items = registrations
    if (search) {
      const searchQuery = search.toLowerCase()
      items = items.filter(
        r =>
          r.user.name.toLowerCase().includes(searchQuery) ||
          r.user.displayName.toLowerCase().includes(searchQuery) ||
          (r.team?.name.toLowerCase().includes(searchQuery) ?? false),
      )
    }
    if (statusFilter !== 'all') {
      items = items.filter(r => r.status === statusFilter)
    }
    if (paymentFilter !== 'all') {
      items = items.filter(r => r.paymentStatus === paymentFilter)
    }
    return items
  }, [registrations, search, statusFilter, paymentFilter])

  const { page, totalPages, paginated, prevPage, nextPage } = paginate(filtered)

  // Reset page when filters change
  const handleSearch = useCallback(
    (value: string) => {
      setSearch(value)
      resetPage()
    },
    [resetPage],
  )

  const handleStatusFilter = useCallback(
    (value: string) => {
      setStatusFilter(value)
      resetPage()
    },
    [resetPage],
  )

  const handlePaymentFilter = useCallback(
    (value: string) => {
      setPaymentFilter(value)
      resetPage()
    },
    [resetPage],
  )

  const toggleExpanded = (id: string) => {
    setExpandedId(prev => (prev === id ? null : id))
  }

  // Count pending registrations for warning
  const pendingCount = registrations.filter(
    r => r.status === RegistrationStatus.PENDING,
  ).length

  return (
    <div className="space-y-4">
      {/* Warning banner for pending registrations */}
      {pendingCount > 0 && (
        <div className="flex items-center gap-2 rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-sm text-amber-400">
          <CreditCard className="size-4 shrink-0" />
          {pendingCount} inscription(s) en attente de paiement.
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-zinc-500" />
          <Input
            placeholder="Rechercher un joueur..."
            value={search}
            onChange={e => handleSearch(e.target.value)}
            className="pl-9"
            aria-label="Rechercher un joueur"
          />
        </div>
        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={handleStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous</SelectItem>
              <SelectItem value={RegistrationStatus.PENDING}>
                En attente
              </SelectItem>
              <SelectItem value={RegistrationStatus.CONFIRMED}>
                Confirmé
              </SelectItem>
            </SelectContent>
          </Select>
          {isPaid && (
            <Select value={paymentFilter} onValueChange={handlePaymentFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Paiement" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value={PaymentStatus.PAID}>Payé</SelectItem>
                <SelectItem value={PaymentStatus.PENDING}>
                  En attente
                </SelectItem>
                <SelectItem value={PaymentStatus.REFUNDED}>
                  Remboursé
                </SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {/* Count */}
      <p className="text-xs text-zinc-500">
        {filtered.length} inscription(s)
        {filtered.length !== registrations.length &&
          ` sur ${registrations.length}`}
      </p>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-white/5 bg-white/2 p-8 text-center backdrop-blur-sm">
          <p className="text-sm text-zinc-500">Aucune inscription trouvée.</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-white/5 bg-white/2 backdrop-blur-sm">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-white/5 hover:bg-transparent">
                  <TableHead className="w-8 text-zinc-400" />
                  <TableHead className="text-zinc-400">Joueur</TableHead>
                  {isTeam && (
                    <TableHead className="hidden text-zinc-400 md:table-cell">
                      Équipe
                    </TableHead>
                  )}
                  <TableHead className="text-zinc-400">Statut</TableHead>
                  {isPaid && (
                    <TableHead className="hidden text-zinc-400 sm:table-cell">
                      Paiement
                    </TableHead>
                  )}
                  <TableHead className="hidden text-zinc-400 lg:table-cell">
                    Date
                  </TableHead>
                  <TableHead className="w-10 text-zinc-400" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginated.map(reg => {
                  const isExpanded = expandedId === reg.id
                  const hasFieldValues =
                    fields.length > 0 &&
                    Object.keys(parseFieldValues(reg.fieldValues)).length > 0
                  return (
                    <RegistrationRow
                      key={reg.id}
                      registration={reg}
                      tournament={tournament}
                      teams={teams}
                      fields={fields}
                      isTeam={isTeam}
                      isPaid={isPaid}
                      isExpanded={isExpanded}
                      hasFieldValues={hasFieldValues}
                      onToggleExpand={() => toggleExpanded(reg.id)}
                    />
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Pagination */}
      <AdminPagination
        page={page}
        totalPages={totalPages}
        onPrev={prevPage}
        onNext={nextPage}
      />
    </div>
  )
}
