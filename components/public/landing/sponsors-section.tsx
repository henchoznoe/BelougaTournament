/**
 * File: components/public/landing/sponsors-section.tsx
 * Description: Sponsors showcase with infinite scrolling marquee of partner logos.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

'use client'

import { Handshake } from 'lucide-react'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils/cn'
import type { Sponsor } from '@/prisma/generated/prisma/client'

interface SponsorsSectionProps {
  sponsors: Sponsor[]
}

/** How long each image is shown before cycling to the next one (ms). */
const IMAGE_CYCLE_MS = 4000

const SponsorLogo = ({ sponsor }: { sponsor: Sponsor }) => {
  const [activeIndex, setActiveIndex] = useState(0)
  const hasMultipleImages = sponsor.imageUrls.length > 1

  // Auto-cycle images when there are multiple
  useEffect(() => {
    if (!hasMultipleImages) return
    const id = setInterval(
      () => setActiveIndex(i => (i + 1) % sponsor.imageUrls.length),
      IMAGE_CYCLE_MS,
    )
    return () => clearInterval(id)
  }, [hasMultipleImages, sponsor.imageUrls.length])

  const image = (
    <div
      className={cn(
        'group/logo relative flex h-24 w-48 shrink-0 items-center justify-center rounded-2xl border border-white/5 bg-white/2 px-6 backdrop-blur-sm transition-all duration-500',
        'hover:border-blue-500/20 hover:bg-white/5 hover:shadow-[0_0_30px_rgba(59,130,246,0.08)]',
      )}
    >
      {sponsor.imageUrls.map((url, i) => (
        <Image
          key={url}
          src={url}
          alt={i === 0 ? sponsor.name : `${sponsor.name} — image ${i + 1}`}
          width={160}
          height={64}
          className={cn(
            'absolute max-h-12 w-auto object-contain transition-all duration-700',
            i === activeIndex ? 'scale-100 opacity-90' : 'scale-95 opacity-0',
          )}
        />
      ))}

      {/* Tooltip with name on hover */}
      <span className="pointer-events-none absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-zinc-900 px-2.5 py-1 text-xs font-medium text-zinc-300 opacity-0 shadow-lg transition-opacity duration-300 group-hover/logo:opacity-100">
        {sponsor.name}
      </span>
    </div>
  )

  if (sponsor.url) {
    return (
      <a
        href={sponsor.url}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={sponsor.name}
        className="shrink-0"
      >
        {image}
      </a>
    )
  }

  return image
}

export const SponsorsSection = ({ sponsors }: SponsorsSectionProps) => {
  if (sponsors.length === 0) return null

  // Each logo is w-48 (12rem) + gap-6 (1.5rem) = 13.5rem per slot.
  // The max-w-6xl container is 72rem, so we need ~6 items to fill the width.
  // The marquee scrolls exactly one "set" then loops, so we need at least 2 full sets.
  const minItemsPerSet = Math.max(6, sponsors.length)
  const repeatCount = Math.ceil(minItemsPerSet / sponsors.length)
  const oneSet = Array.from({ length: repeatCount }, () => sponsors).flat()
  const track = [...oneSet, ...oneSet]

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

      {/* Marquee container */}
      <div className="relative mx-auto max-w-6xl overflow-hidden pb-10">
        {/* Left fade */}
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-linear-to-r from-zinc-950 to-transparent" />
        {/* Right fade */}
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-linear-to-l from-zinc-950 to-transparent" />

        {/* Scrolling track */}
        <div className="group/marquee flex w-max animate-marquee gap-6 hover:[animation-play-state:paused]">
          {track.map((sponsor, i) => (
            <SponsorLogo
              key={`${sponsor.id}-${i.toString()}`}
              sponsor={sponsor}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
