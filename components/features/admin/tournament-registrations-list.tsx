/**
 * File: components/features/admin/tournament-registrations-list.tsx
 * Description: Client component displaying tournament registrations with search and status management.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

'use client'

import { Download, Search } from 'lucide-react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useMemo, useState, useTransition } from 'react'
import { toast } from 'sonner'
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
import { updateRegistrationStatus } from '@/lib/actions/tournaments'
import type { TournamentRegistrationItem } from '@/lib/types/tournament'
import { cn } from '@/lib/utils/cn'
import { formatDateTime } from '@/lib/utils/formatting'
import type { RegistrationStatus } from '@/prisma/generated/prisma/enums'

const STATUS_STYLES: Record<RegistrationStatus, string> = {
  PENDING: 'bg-amber-500/10 text-amber-400',
  APPROVED: 'bg-emerald-500/10 text-emerald-400',
  REJECTED: 'bg-red-500/10 text-red-400',
  WAITLIST: 'bg-blue-500/10 text-blue-400',
} as const

const STATUS_LABELS: Record<RegistrationStatus, string> = {
  PENDING: 'En attente',
  APPROVED: 'Approuvée',
  REJECTED: 'Refusée',
  WAITLIST: "Liste d'attente",
} as const

interface TournamentRegistrationsListProps {
  registrations: TournamentRegistrationItem[]
  tournamentId: string
}

export const TournamentRegistrationsList = ({
  registrations,
  tournamentId,
}: TournamentRegistrationsListProps) => {
  const [search, setSearch] = useState('')
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

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

  const handleStatusChange = (
    registration: TournamentRegistrationItem,
    newStatus: RegistrationStatus,
  ) => {
    if (newStatus === registration.status) return
    startTransition(async () => {
      const result = await updateRegistrationStatus({
        id: registration.id,
        tournamentId,
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

  const handleExportCsv = () => {
    window.open(`/api/admin/tournaments/${tournamentId}/export-csv`)
  }

  const statusCount = (status: RegistrationStatus) =>
    registrations.filter(r => r.status === status).length

  return (
    <>
      {/* Search + stats */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <div className="relative max-w-xs flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-zinc-500" />
            <Input
              placeholder="Rechercher une inscription..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="border-white/10 bg-white/5 pl-9 text-zinc-200 placeholder:text-zinc-600"
            />
          </div>
          <Button
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
            {registrations.length} inscription
            {registrations.length !== 1 ? 's' : ''}
          </span>
          {statusCount('APPROVED') > 0 && (
            <span className="text-emerald-400">
              {statusCount('APPROVED')} approuvée
              {statusCount('APPROVED') !== 1 ? 's' : ''}
            </span>
          )}
          {statusCount('PENDING') > 0 && (
            <span className="text-amber-400">
              {statusCount('PENDING')} en attente
            </span>
          )}
          {statusCount('WAITLIST') > 0 && (
            <span className="text-blue-400">
              {statusCount('WAITLIST')} en liste d'attente
            </span>
          )}
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
        <div className="rounded-2xl border border-white/5 bg-white/2 backdrop-blur-sm">
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
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Statut
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(registration => (
                <TableRow
                  key={registration.id}
                  className="border-white/5 hover:bg-white/2"
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
                      <span className="text-xs text-zinc-600">—</span>
                    )}
                  </TableCell>

                  {/* Date */}
                  <TableCell className="hidden text-xs text-zinc-500 md:table-cell">
                    {formatDateTime(registration.createdAt)}
                  </TableCell>

                  {/* Status */}
                  <TableCell>
                    <Select
                      value={registration.status}
                      onValueChange={val =>
                        handleStatusChange(
                          registration,
                          val as RegistrationStatus,
                        )
                      }
                      disabled={isPending}
                    >
                      <SelectTrigger className="h-7 w-auto gap-1.5 rounded-full border-none bg-transparent p-0 shadow-none">
                        <span
                          className={cn(
                            'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold',
                            STATUS_STYLES[registration.status],
                          )}
                        >
                          {STATUS_LABELS[registration.status]}
                        </span>
                      </SelectTrigger>
                      <SelectContent position="popper" sideOffset={4}>
                        <SelectItem value="PENDING">En attente</SelectItem>
                        <SelectItem value="APPROVED">Approuvée</SelectItem>
                        <SelectItem value="REJECTED">Refusée</SelectItem>
                        <SelectItem value="WAITLIST">
                          Liste d'attente
                        </SelectItem>
                      </SelectContent>
                    </Select>
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
