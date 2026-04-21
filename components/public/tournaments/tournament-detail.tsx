/**
 * File: components/public/tournaments/tournament-detail.tsx
 * Description: Public tournament detail orchestrator — composes hero, image gallery, stats, prize banner, and tabbed content.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

'use client'

import { ChevronLeft } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { TournamentHero } from '@/components/public/tournaments/detail/tournament-hero'
import { TournamentPrizeBanner } from '@/components/public/tournaments/detail/tournament-prize-banner'
import { TournamentStatsGrid } from '@/components/public/tournaments/detail/tournament-stats-grid'
import { TournamentTabs } from '@/components/public/tournaments/detail/tournament-tabs'
import { ROUTES } from '@/lib/config/routes'
import type {
  AvailableTeam,
  PublicTournamentDetail,
  UserTournamentRegistrationState,
} from '@/lib/types/tournament'
import { cn } from '@/lib/utils/cn'
import { TournamentStatus } from '@/prisma/generated/prisma/enums'

interface TournamentDetailProps {
  tournament: PublicTournamentDetail
  twitchUsername?: string
  availableTeams: AvailableTeam[]
  registrationState: UserTournamentRegistrationState | null
  isAuthenticated: boolean
}

/** Determines the registration status label and color. */
const getRegistrationStatus = (tournament: PublicTournamentDetail) => {
  const now = new Date()
  const open = new Date(tournament.registrationOpen)
  const close = new Date(tournament.registrationClose)

  if (tournament.status === TournamentStatus.ARCHIVED) {
    return {
      label: 'Tournoi terminé',
      className: 'border-zinc-500/30 bg-zinc-500/10 text-zinc-400',
      dotClassName: 'bg-zinc-400',
    }
  }
  if (now < open) {
    return {
      label: 'Inscriptions bientôt',
      className: 'border-amber-500/30 bg-amber-500/10 text-amber-400',
      dotClassName: 'bg-amber-400',
    }
  }
  if (now >= open && now <= close) {
    return {
      label: 'Inscriptions ouvertes',
      className: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
      dotClassName: 'bg-emerald-400 animate-pulse',
    }
  }
  return {
    label: 'Inscriptions fermées',
    className: 'border-red-500/30 bg-red-500/10 text-red-400',
    dotClassName: 'bg-red-400',
  }
}

/** Checks if registration is currently open. */
const isRegistrationOpen = (tournament: PublicTournamentDetail) => {
  if (tournament.status === TournamentStatus.ARCHIVED) return false
  const now = new Date()
  const open = new Date(tournament.registrationOpen)
  const close = new Date(tournament.registrationClose)
  return now >= open && now <= close
}

/** Extracts a Twitch channel name from a full URL, or returns the value as-is if not a URL. */
const extractTwitchChannel = (streamUrl: string): string => {
  try {
    const url = new URL(streamUrl)
    if (url.hostname.includes('twitch.tv')) {
      const parts = url.pathname.split('/').filter(Boolean)
      return parts[0] ?? streamUrl
    }
    return streamUrl
  } catch {
    return streamUrl
  }
}

export const TournamentDetail = ({
  tournament,
  twitchUsername,
  availableTeams,
  registrationState,
  isAuthenticated,
}: TournamentDetailProps) => {
  const registrationStatus = getRegistrationStatus(tournament)
  const registrationOpen = isRegistrationOpen(tournament)
  const [activeImageIndex, setActiveImageIndex] = useState(0)

  const twitchChannel = tournament.streamUrl
    ? extractTwitchChannel(tournament.streamUrl)
    : twitchUsername

  return (
    <div className="mx-auto w-full max-w-4xl space-y-8">
      {/* Back link */}
      <Link
        href={ROUTES.TOURNAMENTS}
        className="group inline-flex items-center gap-2 text-sm text-zinc-500 transition-colors duration-300 hover:text-white"
      >
        <ChevronLeft className="size-4 transition-transform duration-300 group-hover:-translate-x-0.5" />
        Retour aux tournois
      </Link>

      <TournamentHero
        tournament={tournament}
        registrationStatus={registrationStatus}
        activeImageIndex={activeImageIndex}
      />

      {/* Image gallery thumbnails */}
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

      <TournamentStatsGrid tournament={tournament} />

      {tournament.prize && <TournamentPrizeBanner prize={tournament.prize} />}

      <TournamentTabs
        tournament={tournament}
        twitchChannel={twitchChannel}
        availableTeams={availableTeams}
        registrationState={registrationState}
        isAuthenticated={isAuthenticated}
        registrationOpen={registrationOpen}
      />
    </div>
  )
}
