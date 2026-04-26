/**
 * File: components/public/players/player-profile.tsx
 * Description: Public player profile display with stats and tournament history.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import {
  Calendar,
  ChevronLeft,
  Shield,
  ShieldAlert,
  Swords,
  Trophy,
  User,
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { ROUTES } from '@/lib/config/routes'
import type { PublicPlayerProfile } from '@/lib/types/player'
import { cn } from '@/lib/utils/cn'
import { formatDate } from '@/lib/utils/formatting'
import { Role, TournamentFormat } from '@/prisma/generated/prisma/enums'

const ROLE_CONFIG = {
  [Role.USER]: {
    label: 'Joueur',
    icon: User,
    className: 'border-zinc-500/30 bg-zinc-500/10 text-zinc-300',
  },
  [Role.ADMIN]: {
    label: 'Admin',
    icon: Shield,
    className: 'border-blue-500/30 bg-blue-500/10 text-blue-400',
  },
  [Role.SUPER_ADMIN]: {
    label: 'Super Admin',
    icon: ShieldAlert,
    className: 'border-amber-500/30 bg-amber-500/10 text-amber-400',
  },
} as const

interface PlayerProfileProps {
  player: PublicPlayerProfile
}

export const PlayerProfile = ({ player }: PlayerProfileProps) => {
  const roleConfig = ROLE_CONFIG[player.role]
  const RoleIcon = roleConfig.icon

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      {/* Back link */}
      <Link
        href={ROUTES.PLAYERS}
        className="group inline-flex items-center gap-2 text-sm text-zinc-500 transition-colors duration-300 hover:text-white"
      >
        <ChevronLeft className="size-4 transition-transform duration-300 group-hover:-translate-x-0.5" />
        Retour aux joueurs
      </Link>

      {/* Profile card */}
      <div className="relative overflow-hidden rounded-3xl border border-white/5 bg-white/2 p-6 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] backdrop-blur-xl md:p-8">
        <div className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full bg-blue-500/5 blur-3xl" />

        <div className="relative z-10 flex flex-col items-center gap-6">
          {/* Avatar */}
          {player.image ? (
            <Image
              src={player.image}
              alt={player.displayName}
              width={96}
              height={96}
              className="rounded-full ring-2 ring-blue-500/20 shadow-[0_0_30px_rgba(59,130,246,0.15)]"
            />
          ) : (
            <div className="flex size-24 items-center justify-center rounded-full bg-zinc-800 ring-2 ring-blue-500/20">
              <User className="size-10 text-zinc-500" />
            </div>
          )}

          {/* Name & role */}
          <div className="text-center">
            <h1 className="font-paladins text-2xl tracking-wider text-white drop-shadow-[0_0_10px_rgba(59,130,246,0.3)]">
              {player.displayName}
            </h1>
            <div
              className={cn(
                'mt-2 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium',
                roleConfig.className,
              )}
            >
              <RoleIcon className="size-3" />
              {roleConfig.label}
            </div>
          </div>

          {/* Stats */}
          <div className="grid w-full gap-3 sm:grid-cols-2">
            <div className="flex items-center gap-3 rounded-2xl border border-white/5 bg-white/2 px-4 py-3">
              <Calendar className="size-4 shrink-0 text-zinc-500" />
              <div className="flex min-w-0 flex-col">
                <span className="text-[10px] uppercase tracking-wider text-zinc-600">
                  Membre depuis le
                </span>
                <span className="text-sm text-zinc-300">
                  {formatDate(player.createdAt)}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-2xl border border-white/5 bg-white/2 px-4 py-3">
              <Trophy className="size-4 shrink-0 text-zinc-500" />
              <div className="flex min-w-0 flex-col">
                <span className="text-[10px] uppercase tracking-wider text-zinc-600">
                  Tournois
                </span>
                <span className="text-sm text-zinc-300">
                  {player.tournamentHistory.length} participation
                  {player.tournamentHistory.length !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tournament history */}
      <div className="relative overflow-hidden rounded-3xl border border-white/5 bg-white/2 p-6 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] backdrop-blur-xl md:p-8">
        <div className="relative z-10">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl border border-white/5 bg-white/5">
              <Swords className="size-5 text-blue-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                Historique des tournois
              </h2>
              <p className="text-xs text-zinc-500">
                {player.tournamentHistory.length > 0
                  ? `${player.tournamentHistory.length} tournoi${player.tournamentHistory.length > 1 ? 's' : ''}`
                  : 'Aucune participation'}
              </p>
            </div>
          </div>

          {player.tournamentHistory.length > 0 ? (
            <div className="space-y-2">
              {player.tournamentHistory.map(entry => (
                <Link
                  key={entry.tournamentSlug}
                  href={`${ROUTES.TOURNAMENTS}/${entry.tournamentSlug}`}
                  className="group flex items-center gap-4 rounded-2xl border border-white/5 bg-white/2 px-4 py-3 transition-all duration-300 hover:border-blue-500/20 hover:bg-white/4"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-white transition-colors group-hover:text-blue-400">
                      {entry.tournamentTitle}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                      <span>{formatDate(entry.startDate)}</span>
                      <span className="text-zinc-700">·</span>
                      <span>
                        {entry.format === TournamentFormat.SOLO
                          ? 'Solo'
                          : 'Équipe'}
                      </span>
                      {entry.games.length > 0 && (
                        <>
                          <span className="text-zinc-700">·</span>
                          <span>{entry.games.join(', ')}</span>
                        </>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              <p className="max-w-sm text-sm text-zinc-500">
                Ce joueur n&apos;a pas encore participé à un tournoi.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
