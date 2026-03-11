/**
 * File: components/features/admin/dashboard-stats.tsx
 * Description: Dashboard stat cards displaying aggregate platform metrics.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { ClipboardList, Handshake, Swords, Users } from 'lucide-react'
import Link from 'next/link'
import { ROUTES } from '@/lib/config/routes'
import type { DashboardStats } from '@/lib/types/dashboard'

interface DashboardStatsProps {
  stats: DashboardStats
}

const STAT_CARDS = [
  {
    key: 'tournaments',
    label: 'Tournois',
    href: ROUTES.ADMIN_TOURNAMENTS,
    icon: Swords,
    getValue: (s: DashboardStats) => s.tournaments.total,
    getDetail: (s: DashboardStats) => {
      const parts: string[] = []
      if (s.tournaments.byStatus.PUBLISHED > 0)
        parts.push(`${s.tournaments.byStatus.PUBLISHED} publiés`)
      if (s.tournaments.byStatus.DRAFT > 0)
        parts.push(`${s.tournaments.byStatus.DRAFT} brouillons`)
      if (s.tournaments.byStatus.ARCHIVED > 0)
        parts.push(`${s.tournaments.byStatus.ARCHIVED} archivés`)
      return parts.join(' · ') || 'Aucun tournoi'
    },
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
  },
  {
    key: 'users',
    label: 'Utilisateurs',
    href: ROUTES.ADMIN_PLAYERS,
    icon: Users,
    getValue: (s: DashboardStats) => s.users.total,
    getDetail: (s: DashboardStats) => {
      const parts: string[] = []
      if (s.users.players > 0) parts.push(`${s.users.players} joueurs`)
      if (s.users.admins > 0) parts.push(`${s.users.admins} admins`)
      if (s.users.ghosts > 0) parts.push(`${s.users.ghosts} fantômes`)
      return parts.join(' · ') || 'Aucun utilisateur'
    },
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
  },
  {
    key: 'registrations',
    label: 'Inscriptions',
    href: ROUTES.ADMIN_TOURNAMENTS,
    icon: ClipboardList,
    getValue: (s: DashboardStats) => s.registrations.total,
    getDetail: (s: DashboardStats) => {
      const parts: string[] = []
      if (s.registrations.solo > 0) parts.push(`${s.registrations.solo} solo`)
      if (s.registrations.team > 0)
        parts.push(`${s.registrations.team} en équipe`)
      return parts.join(' · ') || 'Aucune inscription'
    },
    color: 'text-sky-400',
    bg: 'bg-sky-500/10',
  },
  {
    key: 'sponsors',
    label: 'Sponsors',
    href: ROUTES.ADMIN_SPONSORS,
    icon: Handshake,
    getValue: (s: DashboardStats) => s.sponsors,
    getDetail: () => 'Partenaires affichés',
    color: 'text-purple-400',
    bg: 'bg-purple-500/10',
  },
] as const

export const DashboardStatsCards = ({ stats }: DashboardStatsProps) => {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {STAT_CARDS.map(card => {
        const Icon = card.icon
        const value = card.getValue(stats)
        const detail = card.getDetail(stats)

        return (
          <Link
            key={card.key}
            href={card.href}
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
