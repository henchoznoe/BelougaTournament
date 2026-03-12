/**
 * File: components/features/admin/user-detail/user-registrations-section.tsx
 * Description: Registrations table section showing all tournament registrations for a user.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

'use client'

import { ClipboardList, ExternalLink, Trophy, Users } from 'lucide-react'
import Link from 'next/link'
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
import type { UserDetail } from '@/lib/types/user'
import { formatShortDate } from '@/lib/utils/formatting'
import { TournamentFormat } from '@/prisma/generated/prisma/enums'

interface UserRegistrationsSectionProps {
  user: UserDetail
}

export const UserRegistrationsSection = ({
  user,
}: UserRegistrationsSectionProps) => {
  return (
    <div className="rounded-2xl border border-white/5 bg-white/2 p-6 backdrop-blur-sm">
      <div className="mb-4 flex items-center gap-2">
        <ClipboardList className="size-4 text-zinc-500" />
        <h3 className="text-sm font-medium uppercase tracking-wider text-zinc-500">
          Inscriptions aux tournois ({user.registrations.length})
        </h3>
      </div>

      {user.registrations.length === 0 ? (
        <p className="py-4 text-center text-sm text-zinc-500">
          Aucune inscription.
        </p>
      ) : (
        <div className="rounded-xl border border-white/5">
          <Table>
            <TableHeader>
              <TableRow className="border-white/5 hover:bg-transparent">
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Tournoi
                </TableHead>
                <TableHead className="hidden text-xs font-semibold uppercase tracking-wider text-zinc-500 sm:table-cell">
                  Format
                </TableHead>
                <TableHead className="hidden text-xs font-semibold uppercase tracking-wider text-zinc-500 sm:table-cell">
                  Équipe
                </TableHead>
                <TableHead className="hidden text-xs font-semibold uppercase tracking-wider text-zinc-500 md:table-cell">
                  Statut
                </TableHead>
                <TableHead className="hidden text-xs font-semibold uppercase tracking-wider text-zinc-500 md:table-cell">
                  Date
                </TableHead>
                <TableHead className="w-10">
                  <span className="sr-only">Lien</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {user.registrations.map(reg => {
                const statusLabel =
                  TOURNAMENT_STATUS_LABELS[reg.tournament.status] ??
                  reg.tournament.status
                const statusClassName =
                  TOURNAMENT_STATUS_STYLES[reg.tournament.status] ??
                  'bg-zinc-500/10 text-zinc-400'

                return (
                  <TableRow
                    key={reg.id}
                    className="border-white/5 hover:bg-white/4"
                  >
                    <TableCell>
                      <span className="flex items-center gap-1.5 text-sm font-medium text-zinc-200">
                        <Trophy className="size-3 shrink-0 text-zinc-500" />
                        {reg.tournament.title}
                      </span>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <span className="text-xs text-zinc-400">
                        {reg.tournament.format === TournamentFormat.SOLO
                          ? 'Solo'
                          : 'Équipe'}
                      </span>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {reg.team ? (
                        <span className="inline-flex items-center gap-1 text-xs text-zinc-400">
                          <Users className="size-3" />
                          {reg.team.name}
                        </span>
                      ) : (
                        <span className="text-xs text-zinc-600">&mdash;</span>
                      )}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${statusClassName}`}
                      >
                        {statusLabel}
                      </span>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <span className="text-xs text-zinc-500">
                        {formatShortDate(reg.createdAt)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`${ROUTES.ADMIN_REGISTRATIONS}?registrationId=${reg.id}`}
                        className="inline-flex items-center text-zinc-500 transition-colors hover:text-zinc-300"
                        aria-label={`Voir l'inscription au tournoi ${reg.tournament.title}`}
                      >
                        <ExternalLink className="size-3.5" />
                      </Link>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
