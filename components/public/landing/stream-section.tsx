/**
 * File: components/public/landing/stream-section.tsx
 * Description: Stream section displaying Twitch embed, live status, and fallback UI.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

'use client'

import { motion } from 'framer-motion'
import { useState } from 'react'
import { TwitchPlayer } from '@/components/public/stream/twitch-player'

interface StreamSectionProps {
  channel: string | undefined
}

export const StreamSection = (props: StreamSectionProps) => {
  // null = loading, true = live, false = offline or no channel
  const [isLive, setIsLive] = useState<boolean | null>(
    props.channel ? null : false,
  )

  return (
    <section className="relative container mx-auto px-4 py-24">
      {/* Header and Badge */}
      <div className="mb-12 flex flex-col items-center text-center">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-6"
        >
          {isLive ? (
            <div className="inline-flex items-center gap-3 rounded-full border border-red-500/30 bg-red-500/10 px-4 py-1.5 shadow-[0_0_15px_rgba(239,68,68,0.2)]">
              <span className="relative flex size-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex size-2.5 rounded-full bg-red-500"></span>
              </span>
              <span className="text-sm font-bold uppercase tracking-widest text-red-500">
                En Live
              </span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-3 rounded-full border border-zinc-500/30 bg-zinc-500/10 px-4 py-1.5">
              <div className="size-2.5 rounded-full bg-zinc-500" />
              <span className="text-sm font-bold uppercase tracking-widest text-zinc-400">
                Hors Ligne
              </span>
            </div>
          )}
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="font-paladins text-3xl tracking-wider text-white sm:text-4xl drop-shadow-[0_0_10px_rgba(255,255,255,0.1)] uppercase"
        >
          Live Stream
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="mt-4 max-w-2xl text-zinc-400"
        >
          Suivez nos tournois en direct, interagissez avec la communauté et ne
          manquez aucune action épique.
        </motion.p>
      </div>

      {/* Stream Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.3 }}
        className="mx-auto w-full max-w-4xl"
      >
        <TwitchPlayer channel={props.channel} onLiveChange={setIsLive} />
      </motion.div>
    </section>
  )
}
