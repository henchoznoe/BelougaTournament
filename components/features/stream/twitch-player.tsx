/**
 * File: components/features/stream/twitch-player.tsx
 * Description: Reusable Twitch player component with fallback and loading states.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

'use client'

import { Tv, VideoOff, Wifi } from 'lucide-react'
import Link from 'next/link'
import Script from 'next/script'
import { useEffect, useId, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils/cn'

interface TwitchPlayerProps {
  channel: string | undefined
  onLiveChange?: (isLive: boolean | null) => void
  className?: string
}

export const TwitchPlayer = ({
  channel,
  onLiveChange,
  className,
}: TwitchPlayerProps) => {
  const embedRef = useRef<HTMLDivElement>(null)
  const [isLive, setIsLive] = useState<boolean | null>(channel ? null : false)
  const [isScriptLoaded, setIsScriptLoaded] = useState(false)

  // Create a unique ID for the container to avoid conflicts during SPA navigation
  const uniqueId = useId().replace(/:/g, '')
  const containerId = `twitch-embed-${channel || 'empty'}-${uniqueId}`

  // Sync internal state with parent if needed
  useEffect(() => {
    if (onLiveChange) onLiveChange(isLive)
  }, [isLive, onLiveChange])

  useEffect(() => {
    if (!channel || !isScriptLoaded || !embedRef.current) {
      if (!channel) setIsLive(false)
      return
    }

    // Clean up any existing instances
    embedRef.current.innerHTML = ''

    // biome-ignore lint/suspicious/noExplicitAny: Twitch API is loaded globally via external script
    const Twitch = (window as any).Twitch
    if (!Twitch || !Twitch.Player) return

    // Fallback: If after 8 seconds we haven't received any state, assume offline
    // (covers invalid channels and deferred offline events)
    const fallbackTimeout = setTimeout(() => {
      setIsLive(prev => (prev === null ? false : prev))
    }, 8000)

    const player = new Twitch.Player(containerId, {
      width: '100%',
      height: '100%',
      channel: channel,
      autoplay: true,
      muted: true,
      parent: [window.location.hostname || 'localhost'],
    })

    player.addEventListener(Twitch.Player.READY, () => {
      // Listen to player state events
      player.addEventListener(Twitch.Player.ONLINE, () => setIsLive(true))
      player.addEventListener(Twitch.Player.OFFLINE, () => setIsLive(false))
    })

    return () => {
      clearTimeout(fallbackTimeout)
      if (embedRef.current) {
        embedRef.current.innerHTML = ''
      }
    }
  }, [channel, isScriptLoaded, containerId])

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/50 shadow-2xl backdrop-blur-xl aspect-video min-h-70 w-full min-w-0',
        className,
      )}
    >
      {/* Script Loading */}
      <Script
        src="https://player.twitch.tv/js/embed/v1.js"
        onLoad={() => setIsScriptLoaded(true)}
        onReady={() => setIsScriptLoaded(true)}
      />

      {/* Glow behind the player when live */}
      {isLive && (
        <div className="absolute inset-0 z-0 animate-pulse bg-blue-500/5 blur-3xl pointer-events-none" />
      )}

      {/* Embedded Player */}
      <div
        id={containerId}
        ref={embedRef}
        className={cn(
          'absolute inset-0 z-10 transition-opacity duration-700 w-full h-full',
          isLive === true ? 'opacity-100' : 'opacity-0 pointer-events-none',
        )}
      />

      {/* Loading State */}
      {isLive === null && channel && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-zinc-950/80 backdrop-blur-sm">
          <Wifi className="size-10 animate-pulse text-zinc-600 mb-4" />
          <p className="font-mono text-sm uppercase tracking-widest text-zinc-500">
            Connexion au stream...
          </p>
        </div>
      )}

      {/* Offline / No Channel Fallback */}
      {isLive === false && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-zinc-950/80 p-4 text-center backdrop-blur-sm sm:p-6">
          <div className="mb-4 inline-flex rounded-full bg-white/5 p-4 ring-1 ring-white/10 sm:mb-6 sm:p-6">
            <VideoOff className="size-8 text-zinc-500 sm:size-12" />
          </div>
          <h3 className="font-paladins text-base tracking-wider text-white uppercase drop-shadow-[0_0_10px_rgba(255,255,255,0.1)] mb-2 sm:text-xl">
            {channel ? 'Le stream est interrompu' : 'Aucune chaîne configurée'}
          </h3>
          <p className="max-w-md text-xs text-zinc-400 mb-4 sm:text-sm sm:mb-8">
            {channel
              ? `Aucune diffusion n'est actuellement en cours sur la chaîne @${channel}. Revenez plus tard pour le prochain tournoi !`
              : "La chaîne Twitch officielle n'a pas encore été configurée pour la diffusion en direct."}
          </p>
          {channel && (
            <Button
              asChild
              variant="outline"
              className="border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10 hover:text-white transition-colors duration-300"
            >
              <Link
                href={`https://twitch.tv/${channel}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Tv className="mr-2 size-4" />
                Visiter la chaîne Twitch
              </Link>
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
