/**
 * File: components/features/admin/dashboard-recent.tsx
 * Description: Dashboard panels showing upcoming tournaments and recent registrations.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import {
  ArrowRight,
  Calendar,
  ClipboardList,
  Gamepad2,
  Users,
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { ROUTES } from '@/lib/config/routes'
import type {
  RecentRegistration,
  UpcomingTournament,
} from '@/lib/types/dashboard'
import { formatDate } from '@/lib/utils/formatting'
import { TournamentFormat } from '@/prisma/generated/prisma/enums'

interface UpcomingTournamentsProps {
  tournaments: UpcomingTournament[]
}

interface RecentRegistrationsProps {
  registrations: RecentRegistration[]
}

export const DashboardUpcomingTournaments = ({
  tournaments,
}: UpcomingTournamentsProps) => {
  return (
    <div className="flex flex-col rounded-2xl border border-white/5 bg-white/2 p-6 backdrop-blur-sm">
      <div className="mb-4 flex items-center gap-2">
        <Calendar className="size-4 text-blue-400" />
        <h2 className="text-sm font-semibold text-white">Prochains tournois</h2>
      </div>

      {tournaments.length === 0 ? (
        <p className="py-4 text-center text-sm text-zinc-500">
          Aucun tournoi à venir.
        </p>
      ) : (
        <>
          <div className="max-h-[420px] space-y-2 overflow-y-auto pr-1">
            {tournaments.map(tournament => (
              <Link
                key={tournament.id}
                href={ROUTES.ADMIN_EDIT_TOURNAMENT(tournament.slug)}
                className="flex items-center justify-between rounded-xl border border-white/5 bg-white/2 px-4 py-3 transition-colors hover:border-white/10 hover:bg-white/5"
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
                  <span
                    className="flex items-center gap-1"
                    title="Inscriptions"
                  >
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
              </Link>
            ))}
          </div>
          <Link
            href={ROUTES.ADMIN_TOURNAMENTS}
            className="mt-4 flex items-center justify-center gap-1 text-xs text-zinc-500 transition-colors hover:text-zinc-300"
          >
            Voir tout
            <ArrowRight className="size-3" />
          </Link>
        </>
      )}
    </div>
  )
}

export const DashboardRecentRegistrations = ({
  registrations,
}: RecentRegistrationsProps) => {
  return (
    <div className="flex flex-col rounded-2xl border border-white/5 bg-white/2 p-6 backdrop-blur-sm">
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
        <>
          <div className="max-h-[420px] space-y-2 overflow-y-auto pr-1">
            {registrations.map(reg => (
              <Link
                key={reg.id}
                href={ROUTES.ADMIN_REGISTRATIONS}
                className="flex items-center justify-between rounded-xl border border-white/5 bg-white/2 px-4 py-3 transition-colors hover:border-white/10 hover:bg-white/5"
              >
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  {reg.user.image ? (
                    <Image
                      src={reg.user.image}
                      alt={reg.user.name}
                      width={28}
                      height={28}
                      className="size-7 shrink-0 rounded-full"
                    />
                  ) : (
                    <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-xs font-medium text-zinc-400">
                      {reg.user.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-white">
                      {reg.user.name}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-zinc-500">
                      {reg.tournament.title}
                      {reg.team && ` · ${reg.team.name}`}
                    </p>
                  </div>
                </div>
                <span className="ml-4 shrink-0 text-[10px] text-zinc-600">
                  {formatDate(reg.createdAt)}
                </span>
              </Link>
            ))}
          </div>
          <Link
            href={ROUTES.ADMIN_REGISTRATIONS}
            className="mt-4 flex items-center justify-center gap-1 text-xs text-zinc-500 transition-colors hover:text-zinc-300"
          >
            Voir tout
            <ArrowRight className="size-3" />
          </Link>
        </>
      )}
    </div>
  )
}
