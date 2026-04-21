/**
 * File: components/admin/dashboard/dashboard-stats.tsx
 * Description: Dashboard stat cards displaying aggregate platform metrics.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { Handshake, Swords, Users } from 'lucide-react'
import Link from 'next/link'
import { ROUTES } from '@/lib/config/routes'
import type { DashboardStats } from '@/lib/types/dashboard'
import { pluralize } from '@/lib/utils/formatting'
import { TournamentStatus } from '@/prisma/generated/prisma/enums'

interface DashboardStatsProps {
  stats: DashboardStats
}

const STAT_CARDS = [
  {
    key: 'users',
    label: 'Utilisateurs',
    href: ROUTES.ADMIN_USERS,
    icon: Users,
    getValue: (s: DashboardStats) => s.users.total,
    getDetail: (s: DashboardStats) =>
      `${s.users.players} joueur${pluralize(s.users.players)} · ${s.users.admins} admin${pluralize(s.users.admins)} · ${s.users.banned} banni${pluralize(s.users.banned)}`,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
  },
  {
    key: 'tournaments',
    label: 'Tournois',
    href: ROUTES.ADMIN_TOURNAMENTS,
    icon: Swords,
    getValue: (s: DashboardStats) => s.tournaments.total,
    getDetail: (s: DashboardStats) =>
      `${s.tournaments.byStatus[TournamentStatus.PUBLISHED]} publié${pluralize(s.tournaments.byStatus[TournamentStatus.PUBLISHED])} · ${s.tournaments.byStatus[TournamentStatus.DRAFT]} brouillon${pluralize(s.tournaments.byStatus[TournamentStatus.DRAFT])} · ${s.tournaments.byStatus[TournamentStatus.ARCHIVED]} archivé${pluralize(s.tournaments.byStatus[TournamentStatus.ARCHIVED])}`,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
  },
  {
    key: 'sponsors',
    label: 'Sponsors',
    href: ROUTES.ADMIN_SPONSORS,
    icon: Handshake,
    getValue: (s: DashboardStats) => s.sponsors.total,
    getDetail: (s: DashboardStats) =>
      `${s.sponsors.enabled} actif${pluralize(s.sponsors.enabled)} · ${s.sponsors.disabled} inactif${pluralize(s.sponsors.disabled)}`,
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
  },
] as const

export const DashboardStatsCards = ({ stats }: DashboardStatsProps) => {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {STAT_CARDS.map(card => {
        const Icon = card.icon
        const value = card.getValue(stats)
        const detail = card.getDetail(stats)

        return (
          <Link
            key={card.key}
            href={card.href}
            aria-label={`Voir les ${card.label.toLowerCase()}`}
            className="cursor-pointer rounded-2xl border border-white/5 bg-white/2 p-5 backdrop-blur-sm transition-colors hover:border-white/10"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                {card.label}
              </p>
              <div className={`rounded-lg p-2 ${card.bg}`}>
                <Icon className={`size-4 ${card.color}`} />
              </div>
            </div>
            <p className="mt-3 text-3xl font-bold text-white">{value}</p>
            <p className="mt-1 text-xs text-zinc-500">{detail}</p>
          </Link>
        )
      })}
    </div>
  )
}
