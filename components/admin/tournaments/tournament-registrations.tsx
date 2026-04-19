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
import { RegistrationRow } from '@/components/admin/tournaments/tournament-registration-row'
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
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type {
  TeamItem,
  TournamentDetail,
  TournamentRegistrationItem,
} from '@/lib/types/tournament'
import {
  PaymentStatus,
  RegistrationStatus,
  RegistrationType,
  TournamentFormat,
} from '@/prisma/generated/prisma/enums'

// ─── Constants ───────────────────────────────────────────────────────────────

const PAGE_SIZE = 10

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
  const [page, setPage] = useState(0)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const isTeam = tournament.format === TournamentFormat.TEAM
  const isPaid = tournament.registrationType === RegistrationType.PAID
  const fields = tournament.fields

  // Filter registrations
  const filtered = useMemo(() => {
    let result = registrations
    if (search) {
      const q = search.toLowerCase()
      result = result.filter(
        r =>
          r.user.name.toLowerCase().includes(q) ||
          r.user.displayName.toLowerCase().includes(q) ||
          (r.team?.name.toLowerCase().includes(q) ?? false),
      )
    }
    if (statusFilter !== 'all') {
      result = result.filter(r => r.status === statusFilter)
    }
    if (paymentFilter !== 'all') {
      result = result.filter(r => r.paymentStatus === paymentFilter)
    }
    return result
  }, [registrations, search, statusFilter, paymentFilter])

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  // Reset page when filters change
  const handleSearch = useCallback((value: string) => {
    setSearch(value)
    setPage(0)
  }, [])

  const handleStatusFilter = useCallback((value: string) => {
    setStatusFilter(value)
    setPage(0)
  }, [])

  const handlePaymentFilter = useCallback((value: string) => {
    setPaymentFilter(value)
    setPage(0)
  }, [])

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
                    Object.keys(reg.fieldValues as Record<string, unknown>)
                      .length > 0
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
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-zinc-500">
            Page {page + 1} / {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => p - 1)}
              disabled={page === 0}
            >
              Précédent
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => p + 1)}
              disabled={page >= totalPages - 1}
            >
              Suivant
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
