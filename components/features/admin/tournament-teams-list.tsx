/**
 * File: components/features/admin/tournament-teams-list.tsx
 * Description: Client component displaying tournament teams with members and registration status.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

'use client'

import { Crown, Search } from 'lucide-react'
import Image from 'next/image'
import { useMemo, useState } from 'react'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import type { TeamItem } from '@/lib/types/tournament'
import { cn } from '@/lib/utils/cn'
import { formatDateTime } from '@/lib/utils/formatting'
import type { RegistrationStatus } from '@/prisma/generated/prisma/enums'

const REGISTRATION_STATUS_STYLES: Record<RegistrationStatus, string> = {
  PENDING: 'bg-amber-500/10 text-amber-400',
  APPROVED: 'bg-emerald-500/10 text-emerald-400',
  REJECTED: 'bg-red-500/10 text-red-400',
  WAITLIST: 'bg-blue-500/10 text-blue-400',
} as const

const REGISTRATION_STATUS_LABELS: Record<RegistrationStatus, string> = {
  PENDING: 'En attente',
  APPROVED: 'Approuvée',
  REJECTED: 'Refusée',
  WAITLIST: "Liste d'attente",
} as const

interface TournamentTeamsListProps {
  teams: TeamItem[]
}

export const TournamentTeamsList = ({ teams }: TournamentTeamsListProps) => {
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    if (!search) return teams
    const q = search.toLowerCase()
    return teams.filter(
      t =>
        t.name.toLowerCase().includes(q) ||
        t.captain.name.toLowerCase().includes(q) ||
        t.captain.displayName.toLowerCase().includes(q) ||
        t.members.some(
          m =>
            m.user.name.toLowerCase().includes(q) ||
            m.user.displayName.toLowerCase().includes(q),
        ),
    )
  }, [teams, search])

  const fullCount = teams.filter(t => t.isFull).length

  return (
    <>
      {/* Search + stats */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-xs flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-zinc-500" />
          <Input
            placeholder="Rechercher une équipe..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="border-white/10 bg-white/5 pl-9 text-zinc-200 placeholder:text-zinc-600"
          />
        </div>
        <div className="flex items-center gap-3 text-xs text-zinc-500">
          <span>
            {teams.length} équipe{teams.length !== 1 ? 's' : ''}
          </span>
          {fullCount > 0 && (
            <span className="text-emerald-400">
              {fullCount} complète{fullCount !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      {/* Teams table */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-white/5 bg-white/2 p-8 text-center backdrop-blur-sm">
          <p className="text-sm text-zinc-500">
            {search
              ? 'Aucune équipe trouvée pour cette recherche.'
              : 'Aucune équipe pour le moment.'}
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-white/5 bg-white/2 backdrop-blur-sm">
          <Table>
            <TableHeader>
              <TableRow className="border-white/5 hover:bg-transparent">
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Equipe
                </TableHead>
                <TableHead className="hidden text-xs font-semibold uppercase tracking-wider text-zinc-500 sm:table-cell">
                  Membres
                </TableHead>
                <TableHead className="hidden text-xs font-semibold uppercase tracking-wider text-zinc-500 md:table-cell">
                  Créée le
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Inscription
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(team => (
                <TableRow
                  key={team.id}
                  className="border-white/5 hover:bg-white/2"
                >
                  {/* Team name + captain */}
                  <TableCell>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-medium text-zinc-200">
                          {team.name}
                        </p>
                        {team.isFull ? (
                          <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
                            Complète
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-400">
                            Incomplète
                          </span>
                        )}
                      </div>
                      <div className="mt-0.5 flex items-center gap-1.5">
                        <Crown className="size-3 text-amber-400" />
                        <span className="text-xs text-zinc-500">
                          {team.captain.displayName}
                        </span>
                      </div>
                    </div>
                  </TableCell>

                  {/* Members */}
                  <TableCell className="hidden sm:table-cell">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex -space-x-2">
                            {team.members.slice(0, 5).map(member => (
                              <div
                                key={member.id}
                                className="relative flex size-7 items-center justify-center overflow-hidden rounded-full border-2 border-zinc-900 bg-white/5"
                              >
                                {member.user.image ? (
                                  <Image
                                    src={member.user.image}
                                    alt={member.user.name}
                                    width={28}
                                    height={28}
                                    className="size-full object-cover"
                                  />
                                ) : (
                                  <span className="text-[10px] font-medium text-zinc-400">
                                    {member.user.name.charAt(0).toUpperCase()}
                                  </span>
                                )}
                              </div>
                            ))}
                            {team.members.length > 5 && (
                              <div className="flex size-7 items-center justify-center rounded-full border-2 border-zinc-900 bg-white/10">
                                <span className="text-[10px] font-medium text-zinc-400">
                                  +{(team.members.length - 5).toString()}
                                </span>
                              </div>
                            )}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent
                          side="bottom"
                          className="max-w-64 border-white/10 bg-zinc-900 text-zinc-300"
                        >
                          <div className="space-y-1 text-xs">
                            {team.members.map(member => (
                              <p key={member.id}>
                                {member.user.displayName}
                                {member.user.id === team.captain.id && (
                                  <span className="ml-1 text-amber-400">
                                    (capitaine)
                                  </span>
                                )}
                              </p>
                            ))}
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableCell>

                  {/* Created at */}
                  <TableCell className="hidden text-xs text-zinc-500 md:table-cell">
                    {formatDateTime(team.createdAt)}
                  </TableCell>

                  {/* Registration status */}
                  <TableCell>
                    {team.registration ? (
                      <span
                        className={cn(
                          'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold',
                          REGISTRATION_STATUS_STYLES[team.registration.status],
                        )}
                      >
                        {REGISTRATION_STATUS_LABELS[team.registration.status]}
                      </span>
                    ) : (
                      <span className="text-xs text-zinc-600">—</span>
                    )}
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
