/**
 * File: components/public/tournaments/detail/tournament-hero.tsx
 * Description: Hero banner with background image, status badge, title, and quick-info badges for the public tournament detail.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

'use client'

import { Calendar, Coins, Gamepad2, Swords, Users } from 'lucide-react'
import Image from 'next/image'
import { QuickBadge } from '@/components/public/tournaments/detail/tournament-detail-shared'
import type { PublicTournamentDetail } from '@/lib/types/tournament'
import { cn } from '@/lib/utils/cn'
import { formatCentimes, formatDate, pluralize } from '@/lib/utils/formatting'
import { TournamentFormat } from '@/prisma/generated/prisma/enums'

interface RegistrationStatus {
  label: string
  className: string
  dotClassName: string
}

interface TournamentHeroProps {
  tournament: PublicTournamentDetail
  registrationStatus: RegistrationStatus
  activeImageIndex: number
}

export const TournamentHero = ({
  tournament,
  registrationStatus,
  activeImageIndex,
}: TournamentHeroProps) => {
  const entryFee =
    tournament.entryFeeAmount && tournament.entryFeeCurrency
      ? formatCentimes(tournament.entryFeeAmount, tournament.entryFeeCurrency)
      : null

  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/5">
      {/* Background image or gradient */}
      {tournament.imageUrls.length > 0 ? (
        <div className="relative h-56 sm:h-72 md:h-80">
          <Image
            src={tournament.imageUrls[activeImageIndex]}
            alt={tournament.title}
            fill
            className="object-cover"
            priority
          />
          {/* Dark overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/70 to-zinc-950/20" />
          <div className="absolute inset-0 bg-gradient-to-r from-zinc-950/50 to-transparent" />
        </div>
      ) : (
        <div className="relative h-44 bg-gradient-to-br from-blue-600/20 via-zinc-950 to-purple-600/10 sm:h-56">
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 to-transparent" />
        </div>
      )}

      {/* Hero content overlay */}
      <div className="relative z-10 -mt-28 px-6 pb-6 sm:-mt-32 md:px-8 md:pb-8">
        {/* Status badge */}
        <div className="mb-4 flex items-center gap-3">
          <span
            className={cn(
              'inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold',
              registrationStatus.className,
            )}
          >
            <span
              className={cn(
                'size-1.5 rounded-full',
                registrationStatus.dotClassName,
              )}
            />
            {registrationStatus.label}
          </span>
          {tournament.games.length > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/5 bg-white/5 px-3 py-1.5 text-xs font-medium text-zinc-300">
              <Gamepad2 className="size-3" />
              {tournament.games.join(', ')}
            </span>
          )}
        </div>

        {/* Title */}
        <h1 className="mb-2 font-paladins text-3xl tracking-wider text-white drop-shadow-[0_0_20px_rgba(59,130,246,0.4)] sm:text-4xl md:text-5xl">
          {tournament.title}
        </h1>

        {/* Quick info row */}
        <div className="mt-4 flex flex-wrap gap-3">
          <QuickBadge
            icon={Swords}
            text={
              tournament.format === TournamentFormat.SOLO
                ? 'Solo'
                : `Équipe de ${tournament.teamSize}`
            }
          />
          <QuickBadge icon={Calendar} text={formatDate(tournament.startDate)} />
          {tournament.format === TournamentFormat.SOLO ? (
            <QuickBadge
              icon={Users}
              text={
                tournament.maxTeams
                  ? `${tournament._count.registrations}/${tournament.maxTeams} inscrits`
                  : `${tournament._count.registrations} inscrit${pluralize(tournament._count.registrations)}`
              }
            />
          ) : (
            <>
              <QuickBadge
                icon={Users}
                text={
                  tournament.maxTeams
                    ? `${tournament._count.teams}/${tournament.maxTeams} équipes`
                    : `${tournament._count.teams} équipe${pluralize(tournament._count.teams)}`
                }
              />
              <QuickBadge
                icon={Users}
                text={`${tournament._count.registrations} joueur${pluralize(tournament._count.registrations)}`}
              />
            </>
          )}
          {entryFee && <QuickBadge icon={Coins} text={entryFee} />}
        </div>
      </div>
    </div>
  )
}
