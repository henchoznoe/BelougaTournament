/**
 * File: components/public/tournaments/tournament-card.tsx
 * Description: Public tournament card for list and archive pages.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

'use client'

import { Calendar, Coins, Gamepad2, Gift, Swords, Users } from 'lucide-react'
import Link from 'next/link'
import { Countdown } from '@/components/public/shared/countdown'
import { TournamentImage } from '@/components/public/tournaments/tournament-image'
import { ROUTES } from '@/lib/config/routes'
import type { PublicTournamentListItem } from '@/lib/types/tournament'
import { cn } from '@/lib/utils/cn'
import {
  formatCentimes,
  formatDate,
  pluralize,
  stripHtml,
} from '@/lib/utils/formatting'
import { getTournamentRegistrationBadge } from '@/lib/utils/tournament-status'
import {
  RegistrationType,
  TournamentFormat,
} from '@/prisma/generated/prisma/enums'

interface TournamentCardProps {
  tournament: PublicTournamentListItem
}

/** Computes registration counts, remaining capacity and fill ratio for a tournament. */
const getSpotsInfo = (tournament: PublicTournamentListItem) => {
  const isTeam = tournament.format === TournamentFormat.TEAM
  const count = isTeam
    ? tournament._count.teams
    : tournament._count.registrations
  const noun = isTeam ? 'équipe' : 'inscrit'
  const cap = tournament.maxTeams
  const hasCap = cap !== null && cap > 0
  const remaining = hasCap ? Math.max(0, cap - count) : null
  const ratio = hasCap && cap > 0 ? Math.min(1, count / cap) : 0
  const isFull = hasCap && remaining === 0

  return { count, noun, cap, hasCap, remaining, ratio, isFull }
}

/** Resolves the entry-fee label (free vs. formatted amount). */
const getFeeLabel = (tournament: PublicTournamentListItem): string => {
  if (
    tournament.registrationType === RegistrationType.PAID &&
    tournament.entryFeeAmount
  ) {
    return formatCentimes(
      tournament.entryFeeAmount,
      tournament.entryFeeCurrency ?? 'CHF',
    )
  }
  return 'Gratuit'
}

export const TournamentCard = ({ tournament }: TournamentCardProps) => {
  const registrationInfo = getTournamentRegistrationBadge(tournament)
  const spots = getSpotsInfo(tournament)
  const isPaid =
    tournament.registrationType === RegistrationType.PAID &&
    Boolean(tournament.entryFeeAmount)
  const isArchived = registrationInfo.phase === 'archived'

  return (
    <Link
      href={`${ROUTES.TOURNAMENTS}/${tournament.slug}`}
      className="glass glow-brand-hover group relative block h-full overflow-hidden rounded-2xl transition-all duration-300 hover:border-brand/20"
    >
      {/* Image banner */}
      {tournament.imageUrls.length > 0 ? (
        <div className="relative aspect-video w-full overflow-hidden">
          <TournamentImage
            src={tournament.imageUrls[0]}
            alt={tournament.title}
            sizes="(max-width: 768px) 100vw, 33vw"
            className="transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-linear-to-t from-zinc-950 via-zinc-950/50 to-transparent" />
        </div>
      ) : (
        <div className="relative flex aspect-video w-full items-center justify-center overflow-hidden bg-linear-to-br from-brand/20 via-zinc-900 to-brand-3/10">
          <Gamepad2 className="size-12 text-zinc-700" />
          <div className="absolute inset-0 bg-linear-to-t from-zinc-950 via-zinc-950/50 to-transparent" />
        </div>
      )}

      {/* Content */}
      <div className="relative p-6">
        {/* Background glow */}
        <div className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full bg-brand/5 blur-3xl" />

        <div className="relative z-10 space-y-4">
          {/* Header: title + registration badge */}
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-lg font-bold text-white transition-colors duration-300 group-hover:text-brand">
              {tournament.title}
            </h3>
            <span
              className={cn(
                'shrink-0 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold',
                registrationInfo.className,
              )}
            >
              {isArchived
                ? 'Terminé'
                : registrationInfo.phase === 'upcoming'
                  ? 'Bientôt'
                  : registrationInfo.label}
            </span>
          </div>

          {/* Description */}
          {tournament.description && (
            <p className="line-clamp-2 text-sm leading-relaxed text-zinc-400">
              {stripHtml(tournament.description)}
            </p>
          )}

          {/* Info pills */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Game */}
            {tournament.games.length > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-surface-border bg-surface px-3 py-1.5 text-xs text-zinc-400">
                <Gamepad2 className="size-3" />
                {tournament.games.join(', ')}
              </span>
            )}

            {/* Format */}
            <span className="inline-flex items-center gap-1.5 rounded-full border border-surface-border bg-surface px-3 py-1.5 text-xs text-zinc-400">
              <Swords className="size-3" />
              {tournament.format === TournamentFormat.SOLO
                ? 'Solo'
                : `Équipe (${tournament.teamSize})`}
            </span>

            {/* Date */}
            <span className="inline-flex items-center gap-1.5 rounded-full border border-surface-border bg-surface px-3 py-1.5 text-xs text-zinc-400">
              <Calendar className="size-3" />
              {formatDate(tournament.startDate)}
            </span>

            {/* Entry fee */}
            <span
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium',
                isPaid
                  ? 'border-brand/20 bg-brand/10 text-brand'
                  : 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400',
              )}
            >
              {isPaid ? (
                <Coins className="size-3" />
              ) : (
                <Gift className="size-3" />
              )}
              {getFeeLabel(tournament)}
            </span>
          </div>

          {/* Capacity progress */}
          {spots.hasCap && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="inline-flex items-center gap-1.5 text-zinc-400">
                  <Users className="size-3.5" />
                  {spots.count} / {spots.cap} {spots.noun}
                  {pluralize(spots.count)}
                </span>
                <span
                  className={cn(
                    'font-medium',
                    spots.isFull ? 'text-amber-400' : 'text-emerald-400',
                  )}
                >
                  {spots.isFull
                    ? 'Complet'
                    : `${spots.remaining} place${pluralize(spots.remaining ?? 0)} restante${pluralize(spots.remaining ?? 0)}`}
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/5">
                <div
                  className={cn(
                    'h-full rounded-full transition-all duration-500',
                    spots.isFull
                      ? 'bg-amber-500/70'
                      : 'bg-linear-to-r from-brand to-brand-2',
                  )}
                  style={{ width: `${Math.max(spots.ratio * 100, 4)}%` }}
                />
              </div>
            </div>
          )}

          {/* Footer: countdown + raw counts when uncapped */}
          {(!spots.hasCap || !isArchived) && (
            <div className="flex items-center justify-between gap-4 border-t border-surface-border pt-4 text-xs text-zinc-500">
              {!spots.hasCap ? (
                <span className="inline-flex items-center gap-1.5">
                  <Users className="size-3.5" />
                  {spots.count} {spots.noun}
                  {pluralize(spots.count)}
                </span>
              ) : (
                <span />
              )}

              {!isArchived && (
                <Countdown
                  target={tournament.startDate}
                  prefix="Débute dans"
                  className="inline-flex items-center gap-1.5 font-medium text-zinc-400"
                />
              )}
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}
