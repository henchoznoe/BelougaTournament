/**
 * File: components/public/tournaments/tournament-image.tsx
 * Description: Presentational tournament image with an ambient blurred backdrop so
 *   any aspect ratio is shown in full (object-contain) without empty bands or cropping.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

'use client'

import Image from 'next/image'
import { cn } from '@/lib/utils/cn'

interface TournamentImageProps {
  src: string
  alt: string
  sizes: string
  priority?: boolean
  /** Applied to the contained foreground image (e.g. hover scale). */
  className?: string
}

/**
 * Renders an image inside a parent `relative` box (which fixes the aspect ratio).
 * A blurred, scaled copy fills the box while the sharp copy is shown in full.
 */
export const TournamentImage = ({
  src,
  alt,
  sizes,
  priority,
  className,
}: TournamentImageProps) => (
  <>
    {/* Ambient backdrop: same image, heavily blurred + dimmed + scaled so it reads as a
        soft halo filling the box rather than a recognizable second copy in the letterbox
        bands. Decorative only — hidden from assistive tech. Same src+sizes as the
        foreground so the browser fetches the image once and reuses it for both layers. */}
    <Image
      src={src}
      alt=""
      aria-hidden
      fill
      sizes={sizes}
      className="scale-110 object-cover blur-3xl brightness-[0.5] saturate-150"
    />
    {/* Foreground: full image, never cropped. */}
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      className={cn('object-contain', className)}
    />
  </>
)
