/**
 * File: components/features/admin/dashboard-stats.tsx
 * Description: Dashboard stat cards displaying aggregate platform metrics.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { Clock, Handshake, Swords, Users } from 'lucide-react'
import type { DashboardStats } from '@/lib/types/dashboard'

interface DashboardStatsProps {
  stats: DashboardStats
}

const STAT_CARDS = [
  {
    key: 'tournaments',
    label: 'Tournois',
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
    key: 'players',
    label: 'Joueurs inscrits',
    icon: Users,
    getValue: (s: DashboardStats) => s.players,
    getDetail: () => 'Comptes avec rôle joueur',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
  },
  {
    key: 'pending',
    label: 'En attente',
    icon: Clock,
    getValue: (s: DashboardStats) => s.pendingRegistrations,
    getDetail: () => 'Inscriptions à traiter',
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
  },
  {
    key: 'sponsors',
    label: 'Sponsors',
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
          <div
            key={card.key}
            className="rounded-2xl border border-white/5 bg-white/2 p-5 backdrop-blur-sm transition-colors hover:border-white/10"
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
          </div>
        )
      })}
    </div>
  )
}
