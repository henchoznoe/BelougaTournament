/**
 * File: components/public/tournaments/detail/tournament-prize-banner.tsx
 * Description: Amber prize banner with rich text content for the public tournament detail view.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

'use client'

import { Trophy } from 'lucide-react'
import { RichText } from '@/components/ui/rich-text'
import { stripHtml } from '@/lib/utils/formatting'

interface TournamentPrizeBannerProps {
  prize: string
}

export const TournamentPrizeBanner = ({
  prize,
}: TournamentPrizeBannerProps) => {
  if (!stripHtml(prize).trim()) return null

  return (
    <div className="relative overflow-hidden rounded-3xl border border-amber-500/20 bg-gradient-to-r from-amber-500/10 via-yellow-500/5 to-amber-500/10 p-6 md:p-8">
      <div className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full bg-amber-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -left-16 -bottom-16 size-48 rounded-full bg-yellow-500/10 blur-3xl" />

      <div className="relative z-10 flex flex-col items-center gap-3 text-center">
        <div className="inline-flex rounded-full bg-amber-500/10 p-3 ring-1 ring-amber-500/20">
          <Trophy className="size-6 text-amber-400" />
        </div>
        <h3 className="font-paladins text-lg tracking-wider text-amber-300 drop-shadow-[0_0_10px_rgba(245,158,11,0.3)]">
          Récompenses
        </h3>
        <RichText
          content={prize}
          className="prose-p:text-amber-200/80 prose-strong:text-amber-200"
        />
      </div>
    </div>
  )
}
