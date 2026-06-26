/**
 * File: components/admin/users/user-detail.tsx
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
  OctagonX,
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
import { ROUTES } from '@/lib/config/routes'
import type { UserDetail as UserDetailType } from '@/lib/types/user'
import { cn } from '@/lib/utils/cn'
import {
  formatCentimes,
  formatDate,
  formatDateTime,
} from '@/lib/utils/formatting'
import { summarizeKeptPayments } from '@/lib/utils/payment-summary'
import {
  PaymentStatus,
  RegistrationStatus,
  TournamentFormat,
} from '@/prisma/generated/prisma/enums'
import { isUserBanned } from './user-detail-actions'

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
  [PaymentStatus.FORFEITED]: 'Donné',
} as const

const PAYMENT_STATUS_STYLES: Record<PaymentStatus, string> = {
  [PaymentStatus.NOT_REQUIRED]: 'bg-zinc-500/10 text-zinc-400',
  [PaymentStatus.UNPAID]: 'bg-amber-500/10 text-amber-400',
  [PaymentStatus.PENDING]: 'bg-amber-500/10 text-amber-400',
  [PaymentStatus.PAID]: 'bg-emerald-500/10 text-emerald-400',
  [PaymentStatus.FAILED]: 'bg-red-500/10 text-red-400',
  [PaymentStatus.REFUNDED]: 'bg-blue-500/10 text-blue-400',
  [PaymentStatus.CANCELLED]: 'bg-zinc-500/10 text-zinc-400',
  [PaymentStatus.FORFEITED]: 'bg-orange-500/10 text-orange-400',
} as const

const FORMAT_LABELS: Record<TournamentFormat, string> = {
  [TournamentFormat.SOLO]: 'Solo',
  [TournamentFormat.TEAM]: 'Équipe',
} as const

// ─── Helpers ─────────────────────────────────────────────────────────────────

// ─── Stats Summary ───────────────────────────────────────────────────────────

interface StatsSummaryProps {
  user: UserDetailType
}

const StatsSummary = ({ user }: StatsSummaryProps) => {
  const stats = useMemo(() => {
    const regs = user.registrations
    // Counts money the org actually kept: PAID + FORFEITED (waived refund).
    const { total: totalPaid, currencies } = summarizeKeptPayments(
      regs.flatMap(r => r.payments),
    )
    return {
      total: regs.length,
      totalPaid,
      currencies,
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
      icon: CreditCard,
      label: 'Déboursé',
      value:
        stats.totalPaid > 0
          ? stats.currencies
              .map(c => formatCentimes(stats.totalPaid, c))
              .join(', ')
          : '—',
      color: 'text-amber-400',
      bg: 'bg-amber-500/10',
    },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2">
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
                Équipe
              </TableHead>
              <TableHead className="text-zinc-400">Inscription</TableHead>
              <TableHead className="text-zinc-400">Paiement</TableHead>
              <TableHead className="hidden text-zinc-400 md:table-cell">
                Montant
              </TableHead>
              <TableHead className="hidden text-zinc-400 lg:table-cell">
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
                </TableCell>
                <TableCell className="hidden text-sm text-zinc-400 sm:table-cell">
                  {reg.team?.name ?? FORMAT_LABELS[reg.tournament.format]}
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
                <TableCell>
                  <span
                    className={cn(
                      'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold',
                      PAYMENT_STATUS_STYLES[reg.paymentStatus],
                    )}
                  >
                    {PAYMENT_STATUS_LABELS[reg.paymentStatus]}
                  </span>
                </TableCell>
                <TableCell className="hidden text-sm text-zinc-400 md:table-cell">
                  {reg.entryFeeAmountSnapshot && reg.entryFeeCurrencySnapshot
                    ? formatCentimes(
                        reg.entryFeeAmountSnapshot,
                        reg.entryFeeCurrencySnapshot,
                      )
                    : '—'}
                </TableCell>
                <TableCell className="hidden text-sm text-zinc-400 lg:table-cell">
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
            {isUserBanned(user) && (
              <div className="mt-3 rounded-lg border border-red-500/20 bg-red-500/5 p-3">
                <div className="flex items-center gap-2 text-red-400">
                  <OctagonX className="size-3.5" />
                  <span className="font-semibold text-xs uppercase tracking-wide">
                    Banni
                  </span>
                </div>
                <p className="mt-1 text-xs text-zinc-400">
                  {user.bannedUntil
                    ? `Jusqu'au ${formatDateTime(user.bannedUntil)}`
                    : 'Bannissement permanent'}
                </p>
                {user.banReason && (
                  <p className="mt-1 text-xs text-zinc-500 italic">
                    {user.banReason}
                  </p>
                )}
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
                Dernier accès
              </dt>
              <dd className="text-right text-zinc-300">
                {user.lastSeenAt ? formatDateTime(user.lastSeenAt) : 'Jamais'}
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
