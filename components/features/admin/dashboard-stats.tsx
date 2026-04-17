/**
 * File: components/features/admin/dashboard-stats.tsx
 * Description: Dashboard stat cards displaying aggregate platform metrics.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { Swords, Users } from 'lucide-react'
import Link from 'next/link'
import { ROUTES } from '@/lib/config/routes'
import type { DashboardStats } from '@/lib/types/dashboard'
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
      `${s.users.players} joueurs · ${s.users.admins} admins`,
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
      `${s.tournaments.byStatus[TournamentStatus.PUBLISHED]} publiés · ${s.tournaments.byStatus[TournamentStatus.DRAFT]} brouillons · ${s.tournaments.byStatus[TournamentStatus.ARCHIVED]} archivés`,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
  },
] as const

export const DashboardStatsCards = ({ stats }: DashboardStatsProps) => {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
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
