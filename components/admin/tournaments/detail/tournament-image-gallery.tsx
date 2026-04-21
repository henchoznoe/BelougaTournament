/**
 * File: components/admin/tournaments/detail/tournament-image-gallery.tsx
 * Description: Image gallery with thumbnail selection for the tournament detail view.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

'use client'

import Image from 'next/image'
import { useState } from 'react'
import { cn } from '@/lib/utils/cn'

interface TournamentImageGalleryProps {
  imageUrls: string[]
  name: string
}

export const TournamentImageGallery = ({
  imageUrls,
  name,
}: TournamentImageGalleryProps) => {
  const [selectedIndex, setSelectedIndex] = useState(0)

  if (imageUrls.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center rounded-2xl border border-white/5 bg-white/2">
        <p className="text-sm text-zinc-500">Aucune image</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Main image */}
      <div className="relative aspect-[3/1] overflow-hidden rounded-xl border border-white/5 bg-white/2">
        <Image
          src={imageUrls[selectedIndex]}
          alt={`${name} — image ${selectedIndex + 1}`}
          fill
          className="object-contain p-4"
          sizes="(max-width: 768px) 100vw, 800px"
          priority
        />
      </div>

      {/* Thumbnails (only if more than 1 image) */}
      {imageUrls.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {imageUrls.map((url, index) => (
            <button
              key={url}
              type="button"
              onClick={() => setSelectedIndex(index)}
              aria-label={`Voir image ${index + 1}`}
              className={cn(
                'relative size-16 shrink-0 overflow-hidden rounded-lg border transition-all',
                'hover:border-white/20',
                index === selectedIndex
                  ? 'border-blue-500 ring-1 ring-blue-500/50'
                  : 'border-white/5 bg-white/2',
              )}
            >
              <Image
                src={url}
                alt={`${name} — miniature ${index + 1}`}
                fill
                className="object-contain p-1"
                sizes="64px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
