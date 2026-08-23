/**
 * File: components/public/landing/hero-section.tsx
 * Description: Hero section of the landing page
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

'use client'

import { ChevronDown, ChevronRight, Video } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { usePublicSession } from '@/components/providers/public-session-provider'
import { Button } from '@/components/ui/button'
import { DEFAULT_ASSETS } from '@/lib/config/constants'
import { ROUTES } from '@/lib/config/routes'
import type {
  HeroTournamentBadge,
  HeroTournamentBadgeTournament,
} from '@/lib/types/tournament'
import { cn } from '@/lib/utils/cn'
import {
  getNextHeroTournamentBadgeUpdateDelay,
  resolveActiveTournamentSlug,
  resolveHeroTournamentBadge,
} from '@/lib/utils/hero-tournament-badge'

interface HeroSectionProps {
  badge: HeroTournamentBadge
  badgeTournaments: HeroTournamentBadgeTournament[]
  initialActiveTournamentSlug: string | null
  twitchUrl?: string
}

const HERO_BADGE_STYLES: Record<HeroTournamentBadge['variant'], string> = {
  idle: 'border-zinc-400/20 bg-zinc-400/10 text-zinc-300',
  upcoming: 'border-amber-400/30 bg-amber-400/10 text-amber-300',
  live: 'border-brand/30 bg-brand/10 text-brand',
}

const HERO_BADGE_DOT_STYLES: Record<HeroTournamentBadge['variant'], string> = {
  idle: 'bg-zinc-400',
  upcoming: 'bg-amber-400',
  live: 'bg-brand',
}

export const HeroSection = ({
  badge,
  badgeTournaments,
  initialActiveTournamentSlug,
  twitchUrl,
}: HeroSectionProps) => {
  const { sessionUser } = usePublicSession()
  const isAuthenticated = Boolean(sessionUser)
  const [currentBadge, setCurrentBadge] = useState(badge)
  const [activeTournamentSlug, setActiveTournamentSlug] = useState<
    string | null
  >(initialActiveTournamentSlug)

  useEffect(() => {
    let timeoutId: number | undefined

    const refreshBadge = () => {
      const now = new Date()
      setCurrentBadge(resolveHeroTournamentBadge(badgeTournaments, now))
      setActiveTournamentSlug(
        resolveActiveTournamentSlug(badgeTournaments, now),
      )

      const nextDelay = getNextHeroTournamentBadgeUpdateDelay(
        badgeTournaments,
        now,
      )

      if (nextDelay !== null) {
        timeoutId = window.setTimeout(refreshBadge, nextDelay)
      }
    }

    refreshBadge()

    return () => {
      if (timeoutId !== undefined) {
        window.clearTimeout(timeoutId)
      }
    }
  }, [badgeTournaments])

  return (
    <section className="relative flex h-dvh flex-col items-center justify-center overflow-hidden px-4 text-center">
      <div className="absolute inset-0 z-0 select-none">
        <Image
          alt="Belouga Tournament Background"
          src={DEFAULT_ASSETS.BG_IMAGE}
          fill
          priority
          className="object-cover opacity-50"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-linear-to-b from-zinc-950/80 via-zinc-950/50 to-zinc-950" />
        {/* Faint cyber grid that fades out towards the edges. */}
        <div className="absolute inset-0 opacity-[0.18] [background-image:linear-gradient(to_right,rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:64px_64px] [mask-image:radial-gradient(ellipse_at_center,black_25%,transparent_72%)]" />
        {/* Brand halo behind the title. */}
        <div className="absolute left-1/2 top-1/3 size-[40rem] max-w-[90vw] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand/10 blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-5xl space-y-8">
        <div className="flex justify-center">
          {activeTournamentSlug ? (
            <Link
              href={`${ROUTES.TOURNAMENTS}/${activeTournamentSlug}`}
              className={cn(
                'flex max-w-full items-center gap-2.5 rounded-full border px-4 py-1.5 text-sm font-medium backdrop-blur-sm transition-all duration-300 hover:scale-105',
                HERO_BADGE_STYLES[currentBadge.variant],
              )}
            >
              <span className="relative flex size-2">
                {currentBadge.variant !== 'idle' && (
                  <span
                    className={cn(
                      'absolute inline-flex h-full w-full animate-ping rounded-full opacity-75',
                      HERO_BADGE_DOT_STYLES[currentBadge.variant],
                    )}
                  />
                )}
                <span
                  className={cn(
                    'relative inline-flex size-2 rounded-full',
                    HERO_BADGE_DOT_STYLES[currentBadge.variant],
                  )}
                />
              </span>
              <span className="truncate">{currentBadge.label}</span>
            </Link>
          ) : (
            <span
              className={cn(
                'flex max-w-full items-center gap-2.5 rounded-full border px-4 py-1.5 text-sm font-medium backdrop-blur-sm transition-colors duration-300',
                HERO_BADGE_STYLES[currentBadge.variant],
              )}
            >
              <span className="relative flex size-2">
                <span
                  className={cn(
                    'relative inline-flex size-2 rounded-full',
                    HERO_BADGE_DOT_STYLES[currentBadge.variant],
                  )}
                />
              </span>
              <span className="truncate">{currentBadge.label}</span>
            </span>
          )}
        </div>

        <h1 className="text-6xl font-black tracking-tighter text-white drop-shadow-2xl sm:text-8xl lg:text-9xl">
          Belouga{' '}
          <span className="text-gradient-brand animate-gradient-x">
            Tournament
          </span>
        </h1>

        <p className="mx-auto max-w-2xl text-lg font-medium leading-relaxed text-zinc-300 sm:text-xl">
          L'expérience compétitive ultime fondée par{' '}
          {twitchUrl ? (
            <a
              href={twitchUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-brand underline decoration-brand/30 underline-offset-2 transition-colors hover:text-brand hover:decoration-brand/50"
            >
              Quentadou
            </a>
          ) : (
            <span className="font-semibold text-brand">Quentadou</span>
          )}
          .
          <br />
          Affrontez les meilleurs, suivez l'action en direct sur Twitch et
          forgez votre légende.
        </p>

        <div className="flex flex-wrap justify-center gap-6 pt-8">
          <Button
            asChild
            variant="brand"
            size="lg"
            className="group h-14 px-8 text-lg"
          >
            <Link href={ROUTES.TOURNAMENTS}>
              Découvrir les tournois
              <ChevronRight className="ml-2 size-5 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>

          {!isAuthenticated ? (
            <Button
              asChild
              variant="outline"
              size="lg"
              className="h-14 border-white/10 bg-white/5 px-8 text-lg font-medium text-white backdrop-blur-md transition-all hover:border-brand/50 hover:bg-white/10 hover:text-brand"
            >
              <Link href={ROUTES.LOGIN}>Rejoindre l'aventure</Link>
            </Button>
          ) : (
            <Button
              asChild
              variant="outline"
              size="lg"
              className="group h-14 border-white/10 bg-white/5 px-8 text-lg font-medium text-white backdrop-blur-md transition-all hover:border-brand-3/50 hover:bg-white/10 hover:text-brand-3"
            >
              <Link href={ROUTES.STREAM}>
                <Video className="mr-2 size-5 transition-colors group-hover:text-brand-3" />
                Suivre le stream
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Scroll cue */}
      <div
        className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2"
        aria-hidden="true"
      >
        <ChevronDown className="size-6 animate-bounce-slow text-zinc-500" />
      </div>
    </section>
  )
}
