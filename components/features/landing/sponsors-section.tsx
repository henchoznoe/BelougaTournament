/**
 * File: components/features/landing/sponsors-section.tsx
 * Description: Sponsors showcase wall — large cards with image carousel, name and partnership date always visible.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

'use client'

import { ExternalLink, Handshake } from 'lucide-react'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils/cn'
import { formatShortDate } from '@/lib/utils/formatting'
import type { Sponsor } from '@/prisma/generated/prisma/client'

interface SponsorsSectionProps {
  sponsors: Sponsor[]
}

/** How long each image is shown before cycling to the next one (ms). */
const IMAGE_CYCLE_MS = 4000

const SponsorCard = ({ sponsor }: { sponsor: Sponsor }) => {
  const [activeIndex, setActiveIndex] = useState(0)
  const imageCount = sponsor.imageUrls.length
  const hasMultipleImages = imageCount > 1

  // Auto-cycle images when there are multiple.
  useEffect(() => {
    if (!hasMultipleImages) return
    const id = setInterval(
      () => setActiveIndex(i => (i + 1) % imageCount),
      IMAGE_CYCLE_MS,
    )
    return () => clearInterval(id)
  }, [hasMultipleImages, imageCount])

  const card = (
    <div
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-2xl border border-white/5 bg-white/2 backdrop-blur-md transition-all duration-500',
        'hover:-translate-y-1 hover:border-blue-500/20 hover:bg-white/4 hover:shadow-[0_8px_40px_rgba(59,130,246,0.12)]',
      )}
    >
      {/* Background hover glow */}
      <div className="absolute inset-0 z-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100 bg-blue-500/5" />

      {/* Image zone — large, centered */}
      <div className="relative z-10 flex h-40 items-center justify-center overflow-hidden bg-white/2 px-8 sm:h-48">
        {sponsor.imageUrls.map((url, i) => (
          <Image
            key={url}
            src={url}
            alt={i === 0 ? sponsor.name : `${sponsor.name} — image ${i + 1}`}
            width={280}
            height={160}
            className={cn(
              'absolute max-h-28 w-auto max-w-[80%] object-contain brightness-[0.8] grayscale transition-all duration-700 group-hover:brightness-100 group-hover:grayscale-0 sm:max-h-32',
              i === activeIndex
                ? 'scale-100 opacity-100'
                : 'scale-95 opacity-0',
            )}
          />
        ))}

        {/* Subtle gradient overlay at the bottom of the image zone */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-linear-to-t from-zinc-950/20 to-transparent" />
      </div>

      {/* Info bar */}
      <div className="relative z-10 flex items-center justify-between gap-3 border-t border-white/5 px-5 py-4">
        <div className="flex flex-col gap-1 overflow-hidden">
          <span className="truncate text-sm font-semibold text-zinc-100 transition-colors duration-300 group-hover:text-white">
            {sponsor.name}
          </span>
          <span className="text-xs text-zinc-500">
            Partenaire depuis le {formatShortDate(sponsor.supportedSince)}
          </span>
        </div>

        <div className="flex shrink-0 items-center gap-2.5">
          {/* Dot indicators */}
          {hasMultipleImages && (
            <div className="flex items-center gap-1">
              {sponsor.imageUrls.map((url, i) => (
                <button
                  key={url}
                  type="button"
                  onClick={e => {
                    e.preventDefault()
                    e.stopPropagation()
                    setActiveIndex(i)
                  }}
                  aria-label={`Image ${i + 1}`}
                  className={cn(
                    'size-1.5 rounded-full transition-all duration-300',
                    i === activeIndex
                      ? 'scale-125 bg-blue-400'
                      : 'bg-zinc-600 hover:bg-zinc-400',
                  )}
                />
              ))}
            </div>
          )}

          {/* External link indicator */}
          {sponsor.url && (
            <ExternalLink className="size-3.5 text-zinc-600 transition-colors duration-300 group-hover:text-blue-400" />
          )}
        </div>
      </div>
    </div>
  )

  if (sponsor.url) {
    return (
      <a
        href={sponsor.url}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={sponsor.name}
      >
        {card}
      </a>
    )
  }

  return card
}

export const SponsorsSection = ({ sponsors }: SponsorsSectionProps) => {
  if (sponsors.length === 0) return null

  return (
    <section className="relative container mx-auto px-4 py-24">
      {/* Decorative top line */}
      <div className="absolute left-1/2 top-0 -z-10 h-px w-1/2 -translate-x-1/2 bg-linear-to-r from-transparent via-blue-500/50 to-transparent opacity-50" />

      {/* Section header */}
      <div className="mb-16 text-center">
        <div className="mx-auto mb-6 inline-flex items-center justify-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1.5">
          <Handshake className="size-4 text-blue-400" />
          <span className="text-sm font-semibold uppercase tracking-wider text-blue-400">
            Partenaires
          </span>
        </div>

        <h2 className="font-paladins text-4xl tracking-wider text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.1)] uppercase sm:text-5xl lg:text-6xl">
          Ils nous font confiance
        </h2>

        <p className="mx-auto mt-6 max-w-2xl text-lg text-zinc-400">
          Merci à nos partenaires qui rendent cette aventure possible et
          soutiennent la scène compétitive.
        </p>
      </div>

      {/* Showcase wall */}
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {sponsors.map(sponsor => (
          <SponsorCard key={sponsor.id} sponsor={sponsor} />
        ))}
      </div>
    </section>
  )
}
