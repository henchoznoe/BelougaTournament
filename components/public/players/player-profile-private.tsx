/**
 * File: components/public/players/player-profile-private.tsx
 * Description: Placeholder displayed when a player's profile is private.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { ChevronLeft, Lock } from 'lucide-react'
import Link from 'next/link'
import { ROUTES } from '@/lib/config/routes'

export const PlayerProfilePrivate = () => {
  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      <Link
        href={ROUTES.PLAYERS}
        className="group inline-flex items-center gap-2 text-sm text-zinc-500 transition-colors duration-300 hover:text-white"
      >
        <ChevronLeft className="size-4 transition-transform duration-300 group-hover:-translate-x-0.5" />
        Retour aux joueurs
      </Link>

      <div className="relative overflow-hidden rounded-3xl border border-white/5 bg-white/2 p-6 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] backdrop-blur-xl md:p-8">
        <div className="flex flex-col items-center gap-4 py-8 text-center">
          <div className="flex size-16 items-center justify-center rounded-full bg-zinc-800 ring-2 ring-zinc-700/50">
            <Lock className="size-7 text-zinc-500" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Profil privé</h1>
            <p className="mt-2 max-w-sm text-sm text-zinc-500">
              Ce joueur a choisi de garder son profil privé.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
