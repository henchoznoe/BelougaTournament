/**
 * File: components/admin/tournaments/detail/tournament-stats-summary.tsx
 * Description: Stats summary grid (registrations, teams, entry type, format) for the tournament detail view.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

'use client'

import { CreditCard, Swords, Trophy, Users } from 'lucide-react'
import type { TournamentDetail as TournamentDetailType } from '@/lib/types/tournament'
import { cn } from '@/lib/utils/cn'
import {
  calculateStripeNetAmount,
  formatCentimes,
} from '@/lib/utils/formatting'
import {
  RegistrationType,
  TournamentFormat,
} from '@/prisma/generated/prisma/enums'

const FORMAT_LABELS: Record<TournamentFormat, string> = {
  [TournamentFormat.SOLO]: 'Solo',
  [TournamentFormat.TEAM]: 'Équipe',
} as const

const REGISTRATION_TYPE_LABELS: Record<RegistrationType, string> = {
  [RegistrationType.FREE]: 'Gratuit',
  [RegistrationType.PAID]: 'Payant',
} as const

interface TournamentStatsSummaryProps {
  tournament: TournamentDetailType
}

export const TournamentStatsSummary = ({
  tournament,
}: TournamentStatsSummaryProps) => {
  const isTeam = tournament.format === TournamentFormat.TEAM
  const maxLabel = tournament.maxTeams ? `/ ${tournament.maxTeams}` : ''
  const isPaid = tournament.registrationType === RegistrationType.PAID

  const STAT_ITEMS = [
    {
      icon: Users,
      label: isTeam ? 'Joueurs inscrits' : 'Inscriptions',
      value: isTeam
        ? `${tournament._count.registrations}`
        : `${tournament._count.registrations} ${maxLabel}`,
      subValue: undefined,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10',
    },
    ...(isTeam
      ? [
          {
            icon: Swords,
            label: 'Équipes',
            value: `${tournament._count.teams} ${maxLabel}`,
            subValue: undefined,
            color: 'text-purple-400',
            bg: 'bg-purple-500/10',
          },
        ]
      : []),
    {
      icon: CreditCard,
      label: 'Type',
      value:
        isPaid && tournament.entryFeeAmount && tournament.entryFeeCurrency
          ? `${REGISTRATION_TYPE_LABELS[tournament.registrationType]} — ${formatCentimes(tournament.entryFeeAmount, tournament.entryFeeCurrency)}`
          : REGISTRATION_TYPE_LABELS[tournament.registrationType],
      subValue:
        isPaid && tournament.entryFeeAmount
          ? `(net: ${formatCentimes(calculateStripeNetAmount(tournament.entryFeeAmount), tournament.entryFeeCurrency ?? 'CHF')})`
          : undefined,
      color: isPaid ? 'text-amber-400' : 'text-emerald-400',
      bg: isPaid ? 'bg-amber-500/10' : 'bg-emerald-500/10',
    },
    {
      icon: Trophy,
      label: 'Format',
      value: isTeam
        ? `${FORMAT_LABELS[tournament.format]} de ${tournament.teamSize}`
        : FORMAT_LABELS[tournament.format],
      subValue: undefined,
      color: 'text-cyan-400',
      bg: 'bg-cyan-500/10',
    },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {STAT_ITEMS.map(item => (
        <div
          key={item.label}
          className="flex items-center gap-3 rounded-2xl border border-white/5 bg-white/2 p-4 backdrop-blur-sm"
        >
          <div className={cn('rounded-lg p-2', item.bg)}>
            <item.icon className={cn('size-4', item.color)} />
          </div>
          <div>
            <p className="text-lg font-bold text-white">{item.value}</p>
            {item.subValue && (
              <p className="text-[10px] text-zinc-500">{item.subValue}</p>
            )}
            <p className="text-xs text-zinc-500">{item.label}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
