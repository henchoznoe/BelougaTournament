/**
 * File: components/admin/detail/user-detail.tsx
 * Description: User detail view with profile info, stats summary, and registrations table.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

'use client'

import {
  Calendar,
  Clock,
  CreditCard,
  Info,
  Mail,
  MessageSquare,
  Swords,
  Trophy,
  User,
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useMemo } from 'react'
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
import type { UserDetail as UserDetailType } from '@/lib/types/user'
import { cn } from '@/lib/utils/cn'
import { formatDate } from '@/lib/utils/formatting'
import {
  PaymentStatus,
  RegistrationStatus,
  TournamentFormat,
} from '@/prisma/generated/prisma/enums'

// ─── Constants ───────────────────────────────────────────────────────────────

const REGISTRATION_STATUS_LABELS: Record<RegistrationStatus, string> = {
  [RegistrationStatus.PENDING]: 'En attente',
  [RegistrationStatus.CONFIRMED]: 'Confirmée',
  [RegistrationStatus.CANCELLED]: 'Annulée',
  [RegistrationStatus.EXPIRED]: 'Expirée',
} as const

const REGISTRATION_STATUS_STYLES: Record<RegistrationStatus, string> = {
  [RegistrationStatus.PENDING]: 'bg-amber-500/10 text-amber-400',
  [RegistrationStatus.CONFIRMED]: 'bg-emerald-500/10 text-emerald-400',
  [RegistrationStatus.CANCELLED]: 'bg-red-500/10 text-red-400',
  [RegistrationStatus.EXPIRED]: 'bg-zinc-500/10 text-zinc-400',
} as const

const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  [PaymentStatus.NOT_REQUIRED]: 'Non requis',
  [PaymentStatus.UNPAID]: 'Non payé',
  [PaymentStatus.PENDING]: 'En attente',
  [PaymentStatus.PAID]: 'Payé',
  [PaymentStatus.FAILED]: 'Échoué',
  [PaymentStatus.REFUNDED]: 'Remboursé',
  [PaymentStatus.CANCELLED]: 'Annulé',
} as const

const PAYMENT_STATUS_STYLES: Record<PaymentStatus, string> = {
  [PaymentStatus.NOT_REQUIRED]: 'bg-zinc-500/10 text-zinc-400',
  [PaymentStatus.UNPAID]: 'bg-amber-500/10 text-amber-400',
  [PaymentStatus.PENDING]: 'bg-amber-500/10 text-amber-400',
  [PaymentStatus.PAID]: 'bg-emerald-500/10 text-emerald-400',
  [PaymentStatus.FAILED]: 'bg-red-500/10 text-red-400',
  [PaymentStatus.REFUNDED]: 'bg-blue-500/10 text-blue-400',
  [PaymentStatus.CANCELLED]: 'bg-zinc-500/10 text-zinc-400',
} as const

const FORMAT_LABELS: Record<TournamentFormat, string> = {
  [TournamentFormat.SOLO]: 'Solo',
  [TournamentFormat.TEAM]: 'Équipe',
} as const

// ─── Helpers ─────────────────────────────────────────────────────────────────

const formatAmount = (amount: number, currency: string) => {
  // Amount is in smallest unit (cents), convert to main unit
  return `${(amount / 100).toFixed(2)} ${currency.toUpperCase()}`
}

// ─── Stats Summary ───────────────────────────────────────────────────────────

interface StatsSummaryProps {
  user: UserDetailType
}

const StatsSummary = ({ user }: StatsSummaryProps) => {
  const stats = useMemo(() => {
    const regs = user.registrations
    const confirmed = regs.filter(
      r => r.status === RegistrationStatus.CONFIRMED,
    ).length
    const totalPaid = regs.reduce((sum, r) => {
      const paidPayments = r.payments.filter(
        p => p.status === PaymentStatus.PAID,
      )
      return sum + paidPayments.reduce((s, p) => s + p.amount, 0)
    }, 0)
    // Collect unique currencies from paid payments
    const currencies = new Set<string>()
    for (const r of regs) {
      for (const p of r.payments) {
        if (p.status === PaymentStatus.PAID)
          currencies.add(p.currency.toUpperCase())
      }
    }
    return {
      total: regs.length,
      confirmed,
      totalPaid,
      currencies: [...currencies],
    }
  }, [user.registrations])

  const STAT_ITEMS = [
    {
      icon: Trophy,
      label: 'Inscriptions',
      value: stats.total.toString(),
      color: 'text-blue-400',
      bg: 'bg-blue-500/10',
    },
    {
      icon: Swords,
      label: 'Confirmées',
      value: stats.confirmed.toString(),
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
    },
    {
      icon: CreditCard,
      label: 'Total payé',
      value:
        stats.totalPaid > 0
          ? stats.currencies
              .map(c => formatAmount(stats.totalPaid, c))
              .join(', ')
          : '—',
      color: 'text-amber-400',
      bg: 'bg-amber-500/10',
    },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-3">
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
            <p className="text-xs text-zinc-500">{item.label}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Registrations Table ─────────────────────────────────────────────────────

interface RegistrationsTableProps {
  user: UserDetailType
}

const RegistrationsTable = ({ user }: RegistrationsTableProps) => {
  if (user.registrations.length === 0) {
    return (
      <div className="rounded-2xl border border-white/5 bg-white/2 p-8 text-center backdrop-blur-sm">
        <p className="text-sm text-zinc-500">
          Aucune inscription pour le moment.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-white/5 bg-white/2 backdrop-blur-sm">
      <div className="flex items-center gap-2 border-b border-white/5 px-6 py-4">
        <Swords className="size-4 text-blue-400" />
        <h2 className="text-sm font-semibold text-zinc-300">
          Inscriptions aux tournois
        </h2>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-white/5 hover:bg-transparent">
              <TableHead className="text-zinc-400">Tournoi</TableHead>
              <TableHead className="hidden text-zinc-400 sm:table-cell">
                Format
              </TableHead>
              <TableHead className="hidden text-zinc-400 md:table-cell">
                Équipe
              </TableHead>
              <TableHead className="text-zinc-400">Inscription</TableHead>
              <TableHead className="hidden text-zinc-400 sm:table-cell">
                Paiement
              </TableHead>
              <TableHead className="hidden text-zinc-400 lg:table-cell">
                Montant
              </TableHead>
              <TableHead className="hidden text-zinc-400 md:table-cell">
                Date
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {user.registrations.map(reg => (
              <TableRow key={reg.id} className="border-white/5">
                <TableCell>
                  <Link
                    href={ROUTES.ADMIN_TOURNAMENT_DETAIL(reg.tournament.slug)}
                    className="font-medium text-zinc-200 transition-colors hover:text-blue-400"
                  >
                    {reg.tournament.title}
                  </Link>
                  <span
                    className={cn(
                      'ml-2 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold',
                      TOURNAMENT_STATUS_STYLES[reg.tournament.status],
                    )}
                  >
                    {TOURNAMENT_STATUS_LABELS[reg.tournament.status]}
                  </span>
                </TableCell>
                <TableCell className="hidden text-sm text-zinc-400 sm:table-cell">
                  {FORMAT_LABELS[reg.tournament.format]}
                </TableCell>
                <TableCell className="hidden text-sm text-zinc-400 md:table-cell">
                  {reg.team?.name ?? '—'}
                </TableCell>
                <TableCell>
                  <span
                    className={cn(
                      'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold',
                      REGISTRATION_STATUS_STYLES[reg.status],
                    )}
                  >
                    {REGISTRATION_STATUS_LABELS[reg.status]}
                  </span>
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  <span
                    className={cn(
                      'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold',
                      PAYMENT_STATUS_STYLES[reg.paymentStatus],
                    )}
                  >
                    {PAYMENT_STATUS_LABELS[reg.paymentStatus]}
                  </span>
                </TableCell>
                <TableCell className="hidden text-sm text-zinc-400 lg:table-cell">
                  {reg.entryFeeAmountSnapshot && reg.entryFeeCurrencySnapshot
                    ? formatAmount(
                        reg.entryFeeAmountSnapshot,
                        reg.entryFeeCurrencySnapshot,
                      )
                    : '—'}
                </TableCell>
                <TableCell className="hidden text-sm text-zinc-400 md:table-cell">
                  {formatDate(reg.createdAt)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

// ─── Main Detail Component ───────────────────────────────────────────────────

interface UserDetailProps {
  user: UserDetailType
}

export const UserDetail = ({ user }: UserDetailProps) => {
  const displayLabel = user.displayName || user.name

  return (
    <div className="space-y-6">
      {/* Top section: Avatar + Info cards */}
      <div className="grid gap-4 sm:grid-cols-[auto_1fr_1fr]">
        {/* Avatar card */}
        <div className="flex items-center justify-center rounded-2xl border border-white/5 bg-white/2 p-6 backdrop-blur-sm sm:w-40">
          {user.image ? (
            <Image
              src={user.image}
              alt={displayLabel}
              width={96}
              height={96}
              className="rounded-full"
            />
          ) : (
            <div className="flex size-24 items-center justify-center rounded-full bg-zinc-800 text-3xl font-bold text-zinc-400">
              {displayLabel.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        {/* Informations card */}
        <div className="rounded-2xl border border-white/5 bg-white/2 p-6 backdrop-blur-sm">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-zinc-300">
            <Info className="size-4 text-blue-400" />
            Informations
          </h2>
          <dl className="space-y-3 text-sm">
            <div className="flex items-start justify-between gap-2">
              <dt className="flex items-center gap-2 text-zinc-500">
                <User className="size-3.5" />
                Discord
              </dt>
              <dd className="text-right font-medium text-white">
                @{user.name}
              </dd>
            </div>
            <div className="flex items-start justify-between gap-2">
              <dt className="flex items-center gap-2 text-zinc-500">
                <Mail className="size-3.5" />
                Email
              </dt>
              <dd className="text-right text-zinc-300">{user.email}</dd>
            </div>
            {user.discordId && (
              <div className="flex items-start justify-between gap-2">
                <dt className="flex items-center gap-2 text-zinc-500">
                  <MessageSquare className="size-3.5" />
                  Discord ID
                </dt>
                <dd className="text-right font-mono text-xs text-zinc-400">
                  {user.discordId}
                </dd>
              </div>
            )}
          </dl>
        </div>

        {/* Dates card */}
        <div className="rounded-2xl border border-white/5 bg-white/2 p-6 backdrop-blur-sm">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-zinc-300">
            <Calendar className="size-4 text-blue-400" />
            Dates
          </h2>
          <dl className="space-y-3 text-sm">
            <div className="flex items-start justify-between gap-2">
              <dt className="flex items-center gap-2 text-zinc-500">
                <Calendar className="size-3.5" />
                Membre depuis
              </dt>
              <dd className="text-right font-medium text-white">
                {formatDate(user.createdAt)}
              </dd>
            </div>
            <div className="flex items-start justify-between gap-2">
              <dt className="flex items-center gap-2 text-zinc-500">
                <Clock className="size-3.5" />
                Dernière connexion
              </dt>
              <dd className="text-right text-zinc-300">
                {user.lastLoginAt ? formatDate(user.lastLoginAt) : 'Jamais'}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Stats summary */}
      <StatsSummary user={user} />

      {/* Registrations table */}
      <RegistrationsTable user={user} />
    </div>
  )
}
