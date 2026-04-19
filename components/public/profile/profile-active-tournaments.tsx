/**
 * File: components/public/profile/profile-active-tournaments.tsx
 * Description: Compact cards showing the user's active (confirmed + published) tournaments.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { Calendar, Gamepad2 } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { ROUTES } from '@/lib/config/routes'
import type { UserActiveTournament } from '@/lib/types/tournament'
import { formatDate } from '@/lib/utils/formatting'

interface ProfileActiveTournamentsProps {
  tournaments: UserActiveTournament[]
}

export const ProfileActiveTournaments = ({
  tournaments,
}: ProfileActiveTournamentsProps) => {
  return (
    <div className="space-y-2">
      {tournaments.map(tournament => (
        <Link
          key={tournament.id}
          href={`${ROUTES.TOURNAMENTS}/${tournament.slug}`}
          className="flex items-center gap-4 rounded-2xl border border-white/5 bg-white/2 px-4 py-3 transition-colors duration-200 hover:border-white/10 hover:bg-white/4"
        >
          <div className="relative size-10 shrink-0 overflow-hidden rounded-xl">
            {tournament.imageUrls.length > 0 ? (
              <Image
                src={tournament.imageUrls[0]}
                alt={tournament.title}
                fill
                className="object-cover"
              />
            ) : (
              <div className="flex size-full items-center justify-center bg-gradient-to-br from-blue-600/20 via-zinc-900 to-purple-600/10">
                <Gamepad2 className="size-5 text-zinc-600" />
              </div>
            )}
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="truncate text-sm font-medium text-white">
              {tournament.title}
            </span>
            <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
              {tournament.game && (
                <span className="inline-flex items-center gap-1">
                  <Gamepad2 className="size-3" />
                  {tournament.game}
                </span>
              )}
              <span className="inline-flex items-center gap-1">
                <Calendar className="size-3" />
                {formatDate(tournament.startDate)}
              </span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  )
}
