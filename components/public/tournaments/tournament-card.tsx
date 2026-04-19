/**
 * File: components/public/tournaments/tournament-card.tsx
 * Description: Public tournament card for list and archive pages.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { Calendar, Gamepad2, Swords, Users } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { ROUTES } from '@/lib/config/routes'
import type { PublicTournamentListItem } from '@/lib/types/tournament'
import { cn } from '@/lib/utils/cn'
import { formatDate, stripHtml } from '@/lib/utils/formatting'
import {
  TournamentFormat,
  TournamentStatus,
} from '@/prisma/generated/prisma/enums'

interface TournamentCardProps {
  tournament: PublicTournamentListItem
}

/** Determines the registration status label and color. */
const getRegistrationInfo = (tournament: PublicTournamentListItem) => {
  const now = new Date()
  const open = new Date(tournament.registrationOpen)
  const close = new Date(tournament.registrationClose)

  if (tournament.status === TournamentStatus.ARCHIVED) {
    return {
      label: 'Terminé',
      className: 'border-zinc-500/30 bg-zinc-500/10 text-zinc-400',
    }
  }
  if (now < open) {
    return {
      label: 'Bientôt',
      className: 'border-amber-500/30 bg-amber-500/10 text-amber-400',
    }
  }
  if (now >= open && now <= close) {
    return {
      label: 'Inscriptions ouvertes',
      className: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
    }
  }
  return {
    label: 'Inscriptions fermées',
    className: 'border-red-500/30 bg-red-500/10 text-red-400',
  }
}

/** Computes the spots label (e.g. "12 / 32 inscrits" or "3 / 4 équipes"). */
const getSpotsInfo = (tournament: PublicTournamentListItem) => {
  const isTeam = tournament.format === TournamentFormat.TEAM
  const count = isTeam
    ? tournament._count.teams
    : tournament._count.registrations
  const label = isTeam
    ? count !== 1
      ? 'équipes'
      : 'équipe'
    : count !== 1
      ? 'inscrits'
      : 'inscrit'
  const value = tournament.maxTeams
    ? `${count} / ${tournament.maxTeams}`
    : `${count}`
  return { value, label }
}

export const TournamentCard = ({ tournament }: TournamentCardProps) => {
  const registrationInfo = getRegistrationInfo(tournament)
  const spotsInfo = getSpotsInfo(tournament)

  return (
    <Link
      href={`${ROUTES.TOURNAMENTS}/${tournament.slug}`}
      className="group relative block overflow-hidden rounded-3xl border border-white/5 bg-white/2 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] backdrop-blur-xl transition-all duration-300 hover:border-white/10 hover:bg-white/4 hover:shadow-[0_0_30px_rgba(59,130,246,0.08)]"
    >
      {/* Image banner */}
      {tournament.imageUrls.length > 0 ? (
        <div className="relative h-40 w-full overflow-hidden">
          <Image
            src={tournament.imageUrls[0]}
            alt={tournament.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/50 to-transparent" />
        </div>
      ) : (
        <div className="relative flex h-40 w-full items-center justify-center overflow-hidden bg-gradient-to-br from-blue-600/20 via-zinc-900 to-purple-600/10">
          <Gamepad2 className="size-12 text-zinc-700" />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/50 to-transparent" />
        </div>
      )}

      {/* Content */}
      <div className="relative p-6">
        {/* Background glow */}
        <div className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full bg-blue-500/5 blur-3xl" />

        <div className="relative z-10 space-y-4">
          {/* Header: title + registration badge */}
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-lg font-bold text-white transition-colors duration-300 group-hover:text-blue-100">
              {tournament.title}
            </h3>
            <span
              className={cn(
                'shrink-0 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold',
                registrationInfo.className,
              )}
            >
              {registrationInfo.label}
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
            {tournament.game && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/5 bg-white/2 px-3 py-1.5 text-xs text-zinc-400">
                <Gamepad2 className="size-3" />
                {tournament.game}
              </span>
            )}

            {/* Format */}
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/5 bg-white/2 px-3 py-1.5 text-xs text-zinc-400">
              <Swords className="size-3" />
              {tournament.format === TournamentFormat.SOLO
                ? 'Solo'
                : `Équipe (${tournament.teamSize})`}
            </span>

            {/* Date */}
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/5 bg-white/2 px-3 py-1.5 text-xs text-zinc-400">
              <Calendar className="size-3" />
              {formatDate(tournament.startDate)}
            </span>
          </div>

          {/* Footer: spots + teams */}
          <div className="flex items-center gap-4 border-t border-white/5 pt-4 text-xs text-zinc-500">
            <span className="inline-flex items-center gap-1.5">
              <Users className="size-3.5" />
              {spotsInfo.value} {spotsInfo.label}
            </span>
            {tournament.format === TournamentFormat.TEAM && (
              <span className="inline-flex items-center gap-1.5">
                <Users className="size-3.5" />
                {tournament._count.registrations} joueur
                {tournament._count.registrations !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}
