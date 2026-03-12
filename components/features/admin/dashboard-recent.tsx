/**
 * File: components/features/admin/dashboard-recent.tsx
 * Description: Dashboard panels showing upcoming tournaments, recent registrations, recent users, and recent sponsors.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import {
  ArrowRight,
  Calendar,
  ClipboardList,
  ExternalLink,
  Gamepad2,
  Handshake,
  UserPlus,
  Users,
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { RoleBadge } from '@/components/ui/role-badge'
import { ROUTES } from '@/lib/config/routes'
import type {
  RecentRegistration,
  RecentSponsor,
  RecentUser,
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

interface RecentUsersProps {
  users: RecentUser[]
}

interface RecentSponsorsProps {
  sponsors: RecentSponsor[]
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
            aria-label="Voir tous les tournois"
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
        <ClipboardList className="size-4 text-sky-400" />
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
                    <div
                      aria-hidden="true"
                      className="flex size-7 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-xs font-medium text-zinc-400"
                    >
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
            aria-label="Voir toutes les inscriptions"
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

export const DashboardRecentUsers = ({ users }: RecentUsersProps) => {
  return (
    <div className="flex flex-col rounded-2xl border border-white/5 bg-white/2 p-6 backdrop-blur-sm">
      <div className="mb-4 flex items-center gap-2">
        <UserPlus className="size-4 text-emerald-400" />
        <h2 className="text-sm font-semibold text-white">
          Utilisateurs récents
        </h2>
      </div>

      {users.length === 0 ? (
        <p className="py-4 text-center text-sm text-zinc-500">
          Aucun utilisateur récent.
        </p>
      ) : (
        <>
          <div className="max-h-[420px] space-y-2 overflow-y-auto pr-1">
            {users.map(user => (
              <Link
                key={user.id}
                href={ROUTES.ADMIN_USER_DETAIL(user.id)}
                className="flex items-center justify-between rounded-xl border border-white/5 bg-white/2 px-4 py-3 transition-colors hover:border-white/10 hover:bg-white/5"
              >
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  {user.image ? (
                    <Image
                      src={user.image}
                      alt={user.name}
                      width={28}
                      height={28}
                      className="size-7 shrink-0 rounded-full"
                    />
                  ) : (
                    <div
                      aria-hidden="true"
                      className="flex size-7 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-xs font-medium text-zinc-400"
                    >
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-white">
                      {user.displayName}
                    </p>
                    <div className="mt-0.5 flex items-center gap-2">
                      <span className="truncate text-xs text-zinc-500">
                        {user.name}
                      </span>
                      <RoleBadge role={user.role} />
                    </div>
                  </div>
                </div>
                <span className="ml-4 shrink-0 text-[10px] text-zinc-600">
                  {formatDate(user.createdAt)}
                </span>
              </Link>
            ))}
          </div>
          <Link
            href={ROUTES.ADMIN_USERS}
            aria-label="Voir tous les utilisateurs"
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

export const DashboardRecentSponsors = ({ sponsors }: RecentSponsorsProps) => {
  return (
    <div className="flex flex-col rounded-2xl border border-white/5 bg-white/2 p-6 backdrop-blur-sm">
      <div className="mb-4 flex items-center gap-2">
        <Handshake className="size-4 text-purple-400" />
        <h2 className="text-sm font-semibold text-white">Sponsors récents</h2>
      </div>

      {sponsors.length === 0 ? (
        <p className="py-4 text-center text-sm text-zinc-500">
          Aucun sponsor récent.
        </p>
      ) : (
        <>
          <div className="max-h-[420px] space-y-2 overflow-y-auto pr-1">
            {sponsors.map(sponsor => (
              <Link
                key={sponsor.id}
                href={ROUTES.ADMIN_SPONSORS}
                className="flex items-center justify-between rounded-xl border border-white/5 bg-white/2 px-4 py-3 transition-colors hover:border-white/10 hover:bg-white/5"
              >
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  {sponsor.imageUrls.length > 0 ? (
                    <Image
                      src={sponsor.imageUrls[0]}
                      alt={sponsor.name}
                      width={28}
                      height={28}
                      className="size-7 shrink-0 rounded-lg object-contain"
                    />
                  ) : (
                    <div
                      aria-hidden="true"
                      className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-purple-500/10 text-xs font-medium text-purple-400"
                    >
                      {sponsor.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-medium text-white">
                        {sponsor.name}
                      </p>
                      {sponsor.url && (
                        <a
                          href={sponsor.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-zinc-500 transition-colors hover:text-zinc-300"
                          aria-label={`Visiter ${sponsor.name}`}
                        >
                          <ExternalLink className="size-3" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
                <span className="ml-4 shrink-0 text-[10px] text-zinc-600">
                  {formatDate(sponsor.createdAt)}
                </span>
              </Link>
            ))}
          </div>
          <Link
            href={ROUTES.ADMIN_SPONSORS}
            aria-label="Voir tous les sponsors"
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
