/**
 * File: components/admin/tournaments/detail/tournament-overview-cards.tsx
 * Description: Info cards (Informations, Dates, Configuration) for the tournament detail view.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

'use client'

import {
  Calendar,
  CalendarCheck,
  CalendarX,
  Clock,
  CreditCard,
  ExternalLink,
  Gamepad2,
  Hash,
  ImageIcon,
  Info,
  Layers,
  RefreshCw,
  Settings,
  Swords,
  Users,
  Video,
} from 'lucide-react'
import { useMemo } from 'react'
import { DAY_IN_MS, TOORNAMENT_ID_DISPLAY_LENGTH } from '@/lib/config/constants'
import type { TournamentDetail as TournamentDetailType } from '@/lib/types/tournament'
import { cn } from '@/lib/utils/cn'
import {
  calculateStripeNetAmount,
  formatCentimes,
  formatDateTime,
} from '@/lib/utils/formatting'
import {
  RefundPolicyType,
  RegistrationType,
  TournamentFormat,
} from '@/prisma/generated/prisma/enums'

// ─── Constants ───────────────────────────────────────────────────────────────

const FORMAT_LABELS: Record<TournamentFormat, string> = {
  [TournamentFormat.SOLO]: 'Solo',
  [TournamentFormat.TEAM]: 'Équipe',
} as const

const REGISTRATION_TYPE_LABELS: Record<RegistrationType, string> = {
  [RegistrationType.FREE]: 'Gratuit',
  [RegistrationType.PAID]: 'Payant',
} as const

const REFUND_POLICY_LABELS: Record<RefundPolicyType, string> = {
  [RefundPolicyType.NONE]: 'Aucun remboursement',
  [RefundPolicyType.BEFORE_DEADLINE]: 'Avant délai',
} as const

// ─── DateRow helper ───────────────────────────────────────────────────────────

/** Returns a temporal indicator for a date relative to now. */
const getDateIndicator = (date: Date): { label: string; className: string } => {
  const now = new Date()
  const targetDate = new Date(date)
  if (targetDate < now) return { label: 'Passé', className: 'text-zinc-500' }
  // Within the next 24 hours
  const diff = targetDate.getTime() - now.getTime()
  if (diff < DAY_IN_MS) return { label: 'Bientôt', className: 'text-amber-400' }
  return { label: 'À venir', className: 'text-emerald-400' }
}

interface DateRowProps {
  icon: typeof Calendar
  label: string
  date: Date
  showIndicator?: boolean
}

const DateRow = ({
  icon: Icon,
  label,
  date,
  showIndicator = true,
}: DateRowProps) => {
  const indicator = getDateIndicator(date)
  return (
    <div className="flex items-start justify-between gap-2">
      <dt className="flex items-center gap-2 text-zinc-500">
        <Icon className="size-3.5" />
        {label}
      </dt>
      <dd className="text-right">
        <span className="text-zinc-300">{formatDateTime(date)}</span>
        {showIndicator && (
          <span
            className={cn(
              'ml-2 text-[10px] font-semibold',
              indicator.className,
            )}
          >
            {indicator.label}
          </span>
        )}
      </dd>
    </div>
  )
}

// ─── Overview Cards ───────────────────────────────────────────────────────────

interface TournamentOverviewCardsProps {
  tournament: TournamentDetailType
}

export const TournamentOverviewCards = ({
  tournament,
}: TournamentOverviewCardsProps) => {
  const isTeam = tournament.format === TournamentFormat.TEAM
  const isPaid = tournament.registrationType === RegistrationType.PAID

  const registrationStatus = useMemo(() => {
    const now = new Date()
    const open = new Date(tournament.registrationOpen)
    const close = new Date(tournament.registrationClose)
    if (now < open)
      return { label: 'Pas encore ouvertes', className: 'text-zinc-400' }
    if (now >= open && now < close)
      return { label: 'Ouvertes', className: 'text-emerald-400' }
    return { label: 'Fermées', className: 'text-red-400' }
  }, [tournament.registrationOpen, tournament.registrationClose])

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {/* Informations card */}
      <div className="rounded-2xl border border-white/5 bg-white/2 p-6 backdrop-blur-sm">
        <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-zinc-300">
          <Info className="size-4 text-blue-400" />
          Informations
        </h2>
        <dl className="space-y-3 text-sm">
          {tournament.games.length > 0 && (
            <div className="flex items-start justify-between gap-2">
              <dt className="flex items-center gap-2 text-zinc-500">
                <Gamepad2 className="size-3.5" />
                Jeux
              </dt>
              <dd className="text-right font-medium text-white">
                {tournament.games.join(', ')}
              </dd>
            </div>
          )}
          <div className="flex items-start justify-between gap-2">
            <dt className="flex items-center gap-2 text-zinc-500">
              <Swords className="size-3.5" />
              Format
            </dt>
            <dd className="text-right font-medium text-white">
              {isTeam
                ? `${FORMAT_LABELS[tournament.format]} (${tournament.teamSize}v${tournament.teamSize})`
                : FORMAT_LABELS[tournament.format]}
            </dd>
          </div>
          <div className="flex items-start justify-between gap-2">
            <dt className="flex items-center gap-2 text-zinc-500">
              <Users className="size-3.5" />
              {isTeam ? 'Équipes' : 'Places'}
            </dt>
            <dd className="text-right text-zinc-300">
              {isTeam
                ? tournament._count.teams
                : tournament._count.registrations}
              {tournament.maxTeams
                ? ` / ${tournament.maxTeams}`
                : ' (illimité)'}
            </dd>
          </div>
          <div className="flex items-start justify-between gap-2">
            <dt className="flex items-center gap-2 text-zinc-500">
              <Hash className="size-3.5" />
              Slug
            </dt>
            <dd className="text-right font-mono text-xs text-zinc-400">
              {tournament.slug}
            </dd>
          </div>
        </dl>
      </div>

      {/* Dates card */}
      <div className="rounded-2xl border border-white/5 bg-white/2 p-6 backdrop-blur-sm">
        <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-zinc-300">
          <Calendar className="size-4 text-blue-400" />
          Dates
        </h2>
        <dl className="space-y-3 text-sm">
          <DateRow
            icon={CalendarCheck}
            label="Début"
            date={tournament.startDate}
          />
          <DateRow icon={CalendarX} label="Fin" date={tournament.endDate} />
          <div className="my-2 border-t border-white/5" />
          <div className="flex items-start justify-between gap-2">
            <dt className="flex items-center gap-2 text-zinc-500">
              <Clock className="size-3.5" />
              Inscriptions
            </dt>
            <dd
              className={cn(
                'text-right text-xs font-semibold',
                registrationStatus.className,
              )}
            >
              {registrationStatus.label}
            </dd>
          </div>
          <DateRow
            icon={CalendarCheck}
            label="Ouverture"
            date={tournament.registrationOpen}
          />
          <DateRow
            icon={CalendarX}
            label="Fermeture"
            date={tournament.registrationClose}
          />
        </dl>
      </div>

      {/* Configuration card */}
      <div className="rounded-2xl border border-white/5 bg-white/2 p-6 backdrop-blur-sm">
        <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-zinc-300">
          <Settings className="size-4 text-blue-400" />
          Configuration
        </h2>
        <dl className="space-y-3 text-sm">
          <div className="flex items-start justify-between gap-2">
            <dt className="flex items-center gap-2 text-zinc-500">
              <CreditCard className="size-3.5" />
              Inscription
            </dt>
            <dd className="flex flex-wrap items-center justify-end gap-1">
              <span
                className={cn(
                  'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold',
                  isPaid
                    ? 'bg-amber-500/10 text-amber-400'
                    : 'bg-emerald-500/10 text-emerald-400',
                )}
              >
                {isPaid &&
                tournament.entryFeeAmount &&
                tournament.entryFeeCurrency
                  ? `${formatCentimes(tournament.entryFeeAmount, tournament.entryFeeCurrency)}`
                  : REGISTRATION_TYPE_LABELS[tournament.registrationType]}
              </span>
              {isPaid && tournament.entryFeeAmount && (
                <span className="inline-flex items-center rounded-full bg-zinc-500/10 px-2 py-0.5 text-[10px] font-semibold text-zinc-400">
                  {`${formatCentimes(calculateStripeNetAmount(tournament.entryFeeAmount), tournament.entryFeeCurrency ?? 'CHF')} net`}
                </span>
              )}
            </dd>
          </div>
          {isPaid && (
            <div className="flex items-start justify-between gap-2">
              <dt className="flex items-center gap-2 text-zinc-500">
                <RefreshCw className="size-3.5" />
                Remboursement
              </dt>
              <dd className="text-right text-zinc-300">
                {REFUND_POLICY_LABELS[tournament.refundPolicyType]}
                {tournament.refundPolicyType ===
                  RefundPolicyType.BEFORE_DEADLINE &&
                  tournament.refundDeadlineDays && (
                    <span className="ml-1 text-zinc-500">
                      ({tournament.refundDeadlineDays}j)
                    </span>
                  )}
              </dd>
            </div>
          )}
          {isTeam && (
            <div className="flex items-start justify-between gap-2">
              <dt className="flex items-center gap-2 text-zinc-500">
                <ImageIcon className="size-3.5" />
                Logo d\u2019équipe
              </dt>
              <dd className="text-right">
                <span
                  className={cn(
                    'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold',
                    tournament.teamLogoEnabled
                      ? 'bg-emerald-500/10 text-emerald-400'
                      : 'bg-zinc-500/10 text-zinc-400',
                  )}
                >
                  {tournament.teamLogoEnabled ? 'Activé' : 'Désactivé'}
                </span>
              </dd>
            </div>
          )}
          {tournament.toornamentId && (
            <div className="flex items-start justify-between gap-2">
              <dt className="flex items-center gap-2 text-zinc-500">
                <Layers className="size-3.5" />
                Toornament
              </dt>
              <dd className="text-right">
                <a
                  href={`https://www.toornament.com/tournaments/${tournament.toornamentId}/information`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-blue-400 transition-colors hover:text-blue-300"
                >
                  {tournament.toornamentId.slice(
                    0,
                    TOORNAMENT_ID_DISPLAY_LENGTH,
                  )}
                  ...
                  <ExternalLink className="size-3" />
                </a>
              </dd>
            </div>
          )}
          {tournament.streamUrl && (
            <div className="flex items-start justify-between gap-2">
              <dt className="flex items-center gap-2 text-zinc-500">
                <Video className="size-3.5" />
                Stream
              </dt>
              <dd className="text-right">
                <a
                  href={tournament.streamUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-blue-400 transition-colors hover:text-blue-300"
                >
                  Lien
                  <ExternalLink className="size-3" />
                </a>
              </dd>
            </div>
          )}
        </dl>
      </div>
    </div>
  )
}
