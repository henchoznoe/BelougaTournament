/**
 * File: components/public/tournaments/detail/tournament-hero-gallery.tsx
 * Description: Client gallery island for the public tournament hero and image thumbnails.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

'use client'

import Image from 'next/image'
import { useState } from 'react'
import { TournamentHero } from '@/components/public/tournaments/detail/tournament-hero'
import type { PublicTournamentDetail } from '@/lib/types/tournament'
import { cn } from '@/lib/utils/cn'
import type { TournamentRegistrationBadge } from '@/lib/utils/tournament-status'

interface TournamentHeroGalleryProps {
  tournament: Pick<
    PublicTournamentDetail,
    | 'title'
    | 'games'
    | 'format'
    | 'teamSize'
    | 'maxTeams'
    | 'entryFeeAmount'
    | 'entryFeeCurrency'
    | 'startDate'
    | 'imageUrls'
    | '_count'
  >
  registrationBadge: TournamentRegistrationBadge
}

export const TournamentHeroGallery = ({
  tournament,
  registrationBadge,
}: TournamentHeroGalleryProps) => {
  const [activeImageIndex, setActiveImageIndex] = useState(0)

  return (
    <div className="space-y-8">
      <TournamentHero
        tournament={tournament}
        registrationStatus={registrationBadge}
        activeImageIndex={activeImageIndex}
      />

      {tournament.imageUrls.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {tournament.imageUrls.map((url, index) => (
            <button
              key={url}
              type="button"
              onClick={() => setActiveImageIndex(index)}
              className={cn(
                'relative size-16 shrink-0 overflow-hidden rounded-xl border-2 transition-all duration-200',
                index === activeImageIndex
                  ? 'border-blue-500 ring-1 ring-blue-500/30'
                  : 'border-white/10 opacity-60 hover:opacity-100',
              )}
            >
              <Image
                src={url}
                alt={`${tournament.title} ${index + 1}`}
                fill
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
