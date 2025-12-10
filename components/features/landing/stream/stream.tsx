/**
 * File: components/features/landing/stream/stream.tsx
 * Description: Stream section of the landing page.
 * Author: Noé Henchoz
 * Date: 2025-12-07
 * License: MIT
 */

"use client"

// ----------------------------------------------------------------------
// IMPORTS
// ----------------------------------------------------------------------

import { TwitchEmbed } from "@/components/features/stream/twitch-embed"
import { Suspense } from "react"
import { fr } from "@/lib/i18n/dictionaries/fr"

// ----------------------------------------------------------------------
// COMPONENT
// ----------------------------------------------------------------------

const LiveBadge = () => {
  return (
    <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-red-500/10 px-4 py-1.5 text-sm font-medium text-red-500 animate-pulse">
      <span className="relative flex size-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
        <span className="relative inline-flex size-2 rounded-full bg-red-500"></span>
      </span>
      {fr.pages.home.stream.badge}
    </div>
  )
}

const StreamLoader = () => {
  return (
    <div className="flex h-[600px] w-full items-center justify-center rounded-lg bg-zinc-900 text-zinc-500">
      {fr.pages.home.stream.loading}
    </div>
  )
}

interface StreamSectionProps {
  channel: string | null | undefined
}

export const StreamSection = ({ channel }: StreamSectionProps) => {
  return (
    <section className="container mx-auto px-4" id="stream">
      <div className="rounded-3xl border border-zinc-800 bg-zinc-900/50 p-1 backdrop-blur-xl">
        <div className="rounded-[20px] bg-zinc-950 p-8 md:p-12">
          {/* Header */}
          <div className="mb-12 flex flex-col items-center text-center">
            <LiveBadge />
            <h2 className="mb-4 text-3xl font-bold text-white sm:text-5xl">
              {fr.pages.home.stream.title}
            </h2>
            <p className="max-w-xl text-lg text-zinc-400">
              {fr.pages.home.stream.description}
            </p>
          </div>

          {/* Embed Container */}
          <div className="mx-auto max-w-5xl overflow-hidden rounded-xl shadow-[0_0_50px_-10px_rgba(147,51,234,0.3)] ring-1 ring-white/10">
            <Suspense fallback={<StreamLoader />}>
              <TwitchEmbed channel={channel} />
            </Suspense>
          </div>
        </div>
      </div>
    </section>
  )
}
