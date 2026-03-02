/**
 * File: components/features/landing/sponsors-section.tsx
 * Description: Sponsors section with infinite marquee and glassmorphism cards.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { Handshake } from 'lucide-react'
import Image from 'next/image'
import { cn } from '@/lib/utils/cn'
import { formatShortDate } from '@/lib/utils/formatting'
import type { Sponsor } from '@/prisma/generated/prisma/client'

interface SponsorsSectionProps {
  sponsors: Sponsor[]
}

const MARQUEE_THRESHOLD = 3

const SponsorCard = ({ sponsor }: { sponsor: Sponsor }) => {
  const content = (
    <div
      className={cn(
        'group relative flex h-24 w-48 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/5 bg-white/2 px-6 backdrop-blur-md transition-all duration-500 sm:h-28 sm:w-56',
        'hover:border-white/10 hover:bg-white/5 hover:shadow-[0_0_25px_rgba(59,130,246,0.1)]',
      )}
    >
      {sponsor.imageUrls[0] && (
        <Image
          src={sponsor.imageUrls[0]}
          alt={sponsor.name}
          width={160}
          height={64}
          className="max-h-12 w-auto object-contain brightness-75 grayscale transition-all duration-500 group-hover:brightness-100 group-hover:grayscale-0 sm:max-h-14"
        />
      )}
      {/* Date overlay — slides up from bottom on hover */}
      <div className="absolute inset-x-0 bottom-0 translate-y-full bg-zinc-950/90 py-1.5 text-center backdrop-blur-sm transition-transform duration-300 group-hover:translate-y-0">
        <span className="text-[10px] text-zinc-400">
          Partenaire depuis le {formatShortDate(sponsor.supportedSince)}
        </span>
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
        {content}
      </a>
    )
  }

  return content
}

const SponsorMarquee = ({ sponsors }: { sponsors: Sponsor[] }) => {
  // Each card ≈ 240px (w-56 on sm + gap-4). Repeat sponsors so one set
  // is always wider than the widest viewport (~2160px) → need ≥ 9 cards/set.
  const minCardsPerSet = 9
  const repeatCount = Math.max(1, Math.ceil(minCardsPerSet / sponsors.length))
  const set = Array.from({ length: repeatCount }, () => sponsors).flat()

  // Scale duration with card count so scroll speed stays constant
  const duration = `${set.length * 10}s`

  return (
    <div
      className="group/marquee relative overflow-hidden"
      style={{ '--marquee-duration': duration } as React.CSSProperties}
    >
      {/* Fade edges */}
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-linear-to-r from-zinc-950 to-transparent sm:w-32" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-linear-to-l from-zinc-950 to-transparent sm:w-32" />

      {/* Marquee track — two identical sets; translates by -50% for seamless loop */}
      <div className="flex w-max animate-[marquee_var(--marquee-duration)_linear_infinite] gap-4 group-hover/marquee:paused">
        {set.map((sponsor, i) => (
          <SponsorCard key={`a-${sponsor.id}-${i}`} sponsor={sponsor} />
        ))}
        {/* Duplicate set for seamless loop */}
        {set.map((sponsor, i) => (
          <SponsorCard key={`b-${sponsor.id}-${i}`} sponsor={sponsor} />
        ))}
      </div>
    </div>
  )
}

const SponsorGrid = ({ sponsors }: { sponsors: Sponsor[] }) => {
  return (
    <div className="flex flex-wrap items-center justify-center gap-4">
      {sponsors.map(sponsor => (
        <SponsorCard key={sponsor.id} sponsor={sponsor} />
      ))}
    </div>
  )
}

export const SponsorsSection = ({ sponsors }: SponsorsSectionProps) => {
  if (sponsors.length === 0) return null

  return (
    <section className="relative container mx-auto px-4 py-24">
      {/* Decorative Top Line */}
      <div className="absolute left-1/2 top-0 -z-10 h-px w-1/2 -translate-x-1/2 bg-linear-to-r from-transparent via-blue-500/50 to-transparent opacity-50" />

      {/* Section Header */}
      <div className="mb-16 text-center">
        <div className="mx-auto mb-6 inline-flex items-center justify-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1.5">
          <Handshake className="size-4 text-blue-400" />
          <span className="text-sm font-semibold uppercase tracking-wider text-blue-400">
            Partenaires
          </span>
        </div>

        <h2 className="font-paladins text-4xl tracking-wider text-white sm:text-5xl lg:text-6xl drop-shadow-[0_0_15px_rgba(255,255,255,0.1)] uppercase">
          Ils nous font confiance
        </h2>

        <p className="mx-auto mt-6 max-w-2xl text-lg text-zinc-400">
          Merci à nos partenaires qui rendent cette aventure possible et
          soutiennent la scène compétitive.
        </p>
      </div>

      {/* Sponsors Display */}
      {sponsors.length >= MARQUEE_THRESHOLD ? (
        <SponsorMarquee sponsors={sponsors} />
      ) : (
        <SponsorGrid sponsors={sponsors} />
      )}
    </section>
  )
}
