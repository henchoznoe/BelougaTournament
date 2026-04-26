/**
 * File: components/public/players/players-list.tsx
 * Description: Grid of public player cards for the players list page.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { Trophy, User, Users } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { ROUTES } from '@/lib/config/routes'
import type { PublicPlayerListItem } from '@/lib/types/player'
import { formatDate } from '@/lib/utils/formatting'

interface PlayersListProps {
  players: PublicPlayerListItem[]
}

export const PlayersList = ({ players }: PlayersListProps) => {
  if (players.length === 0) {
    return (
      <div className="mx-auto w-full max-w-2xl">
        <div className="relative overflow-hidden rounded-3xl border border-white/5 bg-white/2 p-6 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] backdrop-blur-xl md:p-8">
          <div className="relative z-10 flex flex-col items-center gap-6 py-8 text-center">
            <div className="flex size-16 items-center justify-center rounded-2xl border border-white/5 bg-white/5">
              <Users className="size-8 text-zinc-600" />
            </div>
            <div className="space-y-3">
              <h2 className="text-xl font-bold text-white">Aucun joueur</h2>
              <p className="mx-auto max-w-md text-sm text-zinc-500">
                Aucun joueur n&apos;a encore rendu son profil public.
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto grid w-full max-w-4xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {players.map(player => (
        <Link
          key={player.id}
          href={ROUTES.PLAYER_DETAIL(player.id)}
          className="group relative overflow-hidden rounded-2xl border border-white/5 bg-white/2 p-5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] backdrop-blur-xl transition-all duration-300 hover:border-blue-500/20 hover:bg-white/4 hover:shadow-[0_0_20px_rgba(59,130,246,0.08)]"
        >
          <div className="flex flex-col items-center gap-3 text-center">
            {player.image ? (
              <Image
                src={player.image}
                alt={player.displayName}
                width={64}
                height={64}
                className="rounded-full ring-2 ring-white/10 transition-all duration-300 group-hover:ring-blue-500/30"
              />
            ) : (
              <div className="flex size-16 items-center justify-center rounded-full bg-zinc-800 ring-2 ring-white/10 transition-all duration-300 group-hover:ring-blue-500/30">
                <User className="size-7 text-zinc-500" />
              </div>
            )}

            <div className="min-w-0">
              <p className="truncate font-semibold text-white transition-colors duration-300 group-hover:text-blue-400">
                {player.displayName}
              </p>
              <p className="mt-0.5 text-xs text-zinc-500">
                Membre depuis le {formatDate(player.createdAt)}
              </p>
            </div>

            <div className="flex items-center gap-1.5 rounded-full border border-white/5 bg-white/5 px-3 py-1 text-xs text-zinc-400">
              <Trophy className="size-3" />
              {player.tournamentCount} tournoi
              {player.tournamentCount !== 1 ? 's' : ''}
            </div>
          </div>
        </Link>
      ))}
    </div>
  )
}
