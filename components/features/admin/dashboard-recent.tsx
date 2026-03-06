/**
 * File: components/features/admin/dashboard-recent.tsx
 * Description: Dashboard panels showing upcoming tournaments and recent registrations with status management.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

'use client'

import { Calendar, ClipboardList, Gamepad2, Users } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { toast } from 'sonner'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@/components/ui/select'
import { updateRegistrationStatus } from '@/lib/actions/tournaments'
import type {
  RecentRegistration,
  UpcomingTournament,
} from '@/lib/types/dashboard'
import { cn } from '@/lib/utils/cn'
import { formatDate } from '@/lib/utils/formatting'
import {
  RegistrationStatus,
  TournamentFormat,
} from '@/prisma/generated/prisma/enums'

interface UpcomingTournamentsProps {
  tournaments: UpcomingTournament[]
}

interface RecentRegistrationsProps {
  registrations: RecentRegistration[]
}

const STATUS_STYLES: Record<RegistrationStatus, string> = {
  [RegistrationStatus.PENDING]: 'bg-amber-500/10 text-amber-400',
  [RegistrationStatus.APPROVED]: 'bg-emerald-500/10 text-emerald-400',
  [RegistrationStatus.REJECTED]: 'bg-red-500/10 text-red-400',
} as const

const STATUS_LABELS: Record<RegistrationStatus, string> = {
  [RegistrationStatus.PENDING]: 'En attente',
  [RegistrationStatus.APPROVED]: 'Approuvée',
  [RegistrationStatus.REJECTED]: 'Refusée',
} as const

export const DashboardUpcomingTournaments = ({
  tournaments,
}: UpcomingTournamentsProps) => {
  return (
    <div className="rounded-2xl border border-white/5 bg-white/2 p-6 backdrop-blur-sm">
      <div className="mb-4 flex items-center gap-2">
        <Calendar className="size-4 text-blue-400" />
        <h2 className="text-sm font-semibold text-white">Prochains tournois</h2>
      </div>

      {tournaments.length === 0 ? (
        <p className="py-4 text-center text-sm text-zinc-500">
          Aucun tournoi à venir.
        </p>
      ) : (
        <div className="space-y-3">
          {tournaments.map(tournament => (
            <div
              key={tournament.id}
              className="flex items-center justify-between rounded-xl border border-white/5 bg-white/2 px-4 py-3"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-white">
                  {tournament.title}
                </p>
                <div className="mt-1 flex items-center gap-3 text-xs text-zinc-500">
                  {tournament.game && (
                    <span className="flex items-center gap-1">
                      <Gamepad2 className="size-3" />
                      {tournament.game}
                    </span>
                  )}
                  <span>{formatDate(tournament.startDate)}</span>
                  <span className="capitalize">
                    {tournament.format === TournamentFormat.SOLO
                      ? 'Solo'
                      : `${tournament.teamSize}v${tournament.teamSize}`}
                  </span>
                </div>
              </div>
              <div className="ml-4 flex items-center gap-3 text-xs text-zinc-400">
                <span className="flex items-center gap-1" title="Inscriptions">
                  <ClipboardList className="size-3" />
                  {tournament._count.registrations}
                </span>
                {tournament.format === TournamentFormat.TEAM && (
                  <span className="flex items-center gap-1" title="Équipes">
                    <Users className="size-3" />
                    {tournament._count.teams}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export const DashboardRecentRegistrations = ({
  registrations,
}: RecentRegistrationsProps) => {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const handleStatusChange = (
    reg: RecentRegistration,
    newStatus: RegistrationStatus,
  ) => {
    if (newStatus === reg.status) return
    startTransition(async () => {
      const result = await updateRegistrationStatus({
        id: reg.id,
        tournamentId: reg.tournament.id,
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

  return (
    <div className="rounded-2xl border border-white/5 bg-white/2 p-6 backdrop-blur-sm">
      <div className="mb-4 flex items-center gap-2">
        <ClipboardList className="size-4 text-blue-400" />
        <h2 className="text-sm font-semibold text-white">
          Inscriptions récentes
        </h2>
      </div>

      {registrations.length === 0 ? (
        <p className="py-4 text-center text-sm text-zinc-500">
          Aucune inscription récente.
        </p>
      ) : (
        <div className="space-y-3">
          {registrations.map(reg => (
            <div
              key={reg.id}
              className="flex items-center justify-between rounded-xl border border-white/5 bg-white/2 px-4 py-3"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-white">
                  {reg.user.name}
                </p>
                <p className="mt-0.5 truncate text-xs text-zinc-500">
                  {reg.tournament.title}
                  {reg.team && ` · ${reg.team.name}`}
                </p>
              </div>
              <div className="ml-4 flex flex-col items-end gap-1">
                <Select
                  value={reg.status}
                  onValueChange={val =>
                    handleStatusChange(reg, val as RegistrationStatus)
                  }
                  disabled={isPending}
                >
                  <SelectTrigger className="h-auto w-auto gap-1 rounded-full border-none bg-transparent p-0 shadow-none">
                    <span
                      className={cn(
                        'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold',
                        STATUS_STYLES[reg.status],
                      )}
                    >
                      {STATUS_LABELS[reg.status]}
                    </span>
                  </SelectTrigger>
                  <SelectContent position="popper" sideOffset={4}>
                    <SelectItem value={RegistrationStatus.PENDING}>
                      En attente
                    </SelectItem>
                    <SelectItem value={RegistrationStatus.APPROVED}>
                      Approuvée
                    </SelectItem>
                    <SelectItem value={RegistrationStatus.REJECTED}>
                      Refusée
                    </SelectItem>
                  </SelectContent>
                </Select>
                <span className="text-[10px] text-zinc-600">
                  {formatDate(reg.createdAt)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
