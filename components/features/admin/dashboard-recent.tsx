/**
 * File: components/features/admin/dashboard-recent.tsx
 * Description: Dashboard panels showing upcoming tournaments and recent registrations.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { Calendar, ClipboardList, Gamepad2, Users } from 'lucide-react'
import type {
  RecentRegistration,
  UpcomingTournament,
} from '@/lib/types/dashboard'
import { formatDate } from '@/lib/utils/formatting'

interface UpcomingTournamentsProps {
  tournaments: UpcomingTournament[]
}

interface RecentRegistrationsProps {
  registrations: RecentRegistration[]
}

const REGISTRATION_STATUS_LABELS: Record<
  string,
  { label: string; className: string }
> = {
  PENDING: { label: 'En attente', className: 'bg-amber-500/10 text-amber-400' },
  APPROVED: {
    label: 'Approuvée',
    className: 'bg-emerald-500/10 text-emerald-400',
  },
  REJECTED: { label: 'Refusée', className: 'bg-red-500/10 text-red-400' },
  WAITLIST: {
    label: "Liste d'attente",
    className: 'bg-zinc-500/10 text-zinc-400',
  },
}

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
                    {tournament.format === 'SOLO'
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
                {tournament.format === 'TEAM' && (
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
          {registrations.map(reg => {
            const statusInfo = REGISTRATION_STATUS_LABELS[reg.status] ?? {
              label: reg.status,
              className: 'bg-zinc-500/10 text-zinc-400',
            }

            return (
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
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${statusInfo.className}`}
                  >
                    {statusInfo.label}
                  </span>
                  <span className="text-[10px] text-zinc-600">
                    {formatDate(reg.createdAt)}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
