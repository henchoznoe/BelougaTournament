/**
 * File: components/public/tournaments/detail/tournament-hero-gallery.tsx
 * Description: Client gallery island with Framer Motion image carousel for the public tournament hero.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import Image from 'next/image'
import { useCallback, useEffect, useRef, useState } from 'react'
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

const slideVariants = {
  enter: (direction: number) => ({
    opacity: 0,
    x: direction > 0 ? 80 : -80,
  }),
  center: {
    opacity: 1,
    x: 0,
  },
  exit: (direction: number) => ({
    opacity: 0,
    x: direction > 0 ? -80 : 80,
  }),
}

export const TournamentHeroGallery = ({
  tournament,
  registrationBadge,
}: TournamentHeroGalleryProps) => {
  const [activeIndex, setActiveIndex] = useState(0)
  const [direction, setDirection] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const imageCount = tournament.imageUrls.length
  const hasMultiple = imageCount > 1
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const goTo = useCallback(
    (index: number, dir: number) => {
      setDirection(dir)
      setActiveIndex(((index % imageCount) + imageCount) % imageCount)
    },
    [imageCount],
  )

  const goNext = useCallback(
    () => goTo(activeIndex + 1, 1),
    [activeIndex, goTo],
  )
  const goPrev = useCallback(
    () => goTo(activeIndex - 1, -1),
    [activeIndex, goTo],
  )

  useEffect(() => {
    if (!hasMultiple || isPaused) return
    intervalRef.current = setInterval(goNext, 5000)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [hasMultiple, isPaused, goNext])

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: hover listeners for auto-advance pause, not interactive
    <div
      className="group relative overflow-hidden rounded-3xl border border-white/5"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Carousel slides */}
      {tournament.imageUrls.length > 0 ? (
        <div className="relative h-56 sm:h-72 md:h-80">
          <AnimatePresence initial={false} custom={direction} mode="popLayout">
            <motion.div
              key={activeIndex}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.4, ease: 'easeInOut' }}
              className="absolute inset-0"
            >
              <Image
                src={tournament.imageUrls[activeIndex]}
                alt={`${tournament.title} ${activeIndex + 1}`}
                fill
                className="object-cover"
                priority={activeIndex === 0}
              />
            </motion.div>
          </AnimatePresence>
          <div className="absolute inset-0 bg-linear-to-t from-zinc-950 via-zinc-950/70 to-zinc-950/20" />
          <div className="absolute inset-0 bg-linear-to-r from-zinc-950/50 to-transparent" />
        </div>
      ) : (
        <div className="relative h-44 bg-linear-to-br from-blue-600/20 via-zinc-950 to-purple-600/10 sm:h-56">
          <div className="absolute inset-0 bg-linear-to-t from-zinc-950 to-transparent" />
        </div>
      )}

      {/* Hero overlay (title, badges) */}
      <TournamentHero
        tournament={tournament}
        registrationStatus={registrationBadge}
      />

      {/* Navigation arrows (desktop, on hover) */}
      {hasMultiple && (
        <>
          <button
            type="button"
            onClick={goPrev}
            className="absolute left-3 top-1/2 z-20 -translate-y-1/2 rounded-full border border-white/10 bg-black/40 p-2 text-white/80 opacity-0 backdrop-blur-sm transition-all duration-200 hover:bg-black/60 hover:text-white group-hover:opacity-100"
            aria-label="Image précédente"
          >
            <ChevronLeft className="size-5" />
          </button>
          <button
            type="button"
            onClick={goNext}
            className="absolute right-3 top-1/2 z-20 -translate-y-1/2 rounded-full border border-white/10 bg-black/40 p-2 text-white/80 opacity-0 backdrop-blur-sm transition-all duration-200 hover:bg-black/60 hover:text-white group-hover:opacity-100"
            aria-label="Image suivante"
          >
            <ChevronRight className="size-5" />
          </button>
        </>
      )}

      {/* Dot indicators */}
      {hasMultiple && (
        <div className="absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 gap-2">
          {tournament.imageUrls.map((url, i) => (
            <button
              key={url}
              type="button"
              onClick={() => goTo(i, i > activeIndex ? 1 : -1)}
              className={cn(
                'rounded-full transition-all duration-300',
                i === activeIndex
                  ? 'size-2.5 bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]'
                  : 'size-2 bg-white/30 hover:bg-white/50',
              )}
              aria-label={`Image ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
