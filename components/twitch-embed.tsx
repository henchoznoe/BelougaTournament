/**
 * File: components/twitch-embed.tsx
 * Description: A component to embed a Twitch stream with offline detection and a fallback UI.
 * Author: Noé Henchoz
 * Date: 2025-12-06
 * License: MIT
 */

"use client";

import Script from "next/script";
import { useEffect, useRef, useState, useId } from "react";
import { Loader2, ScreenShareOff } from "lucide-react";

// Types
interface TwitchEmbedProps {
  channel: string
  width?: string | number
  height?: string | number
}

// Extend the global Window interface for Twitch SDK
declare global {
  interface Window {
    Twitch: {
      Embed: new (
        id: string,
        options: TwitchEmbedOptions
      ) => TwitchPlayer
    }
  }
}

interface TwitchEmbedOptions {
  width: string | number
  height: string | number
  channel: string
  parent: string[]
  layout?: 'video' | 'video-with-chat'
  autoplay?: boolean
  muted?: boolean
  allowfullscreen?: boolean
}

interface TwitchPlayer {
  addEventListener: (event: string, callback: () => void) => void
  removeEventListener: (event: string, callback: () => void) => void
  play: () => void
  pause: () => void
  setMuted: (muted: boolean) => void
  getMuted: () => boolean
  setVolume: (volume: number) => void
}

// Constants
const TWITCH_CONFIG = {
  SCRIPT_URL: 'https://embed.twitch.tv/embed/v1.js',
  DEFAULT_WIDTH: '100%',
  DEFAULT_HEIGHT: 600,
  EVENTS: {
    ONLINE: 'online',
    OFFLINE: 'offline',
    READY: 'VIDEO_READY',
  },
} as const

const getParentDomains = (): string[] => {
  if (typeof window === 'undefined') return []

  const hostname = window.location.hostname
  const parents = [hostname]

  if (hostname === 'localhost') {
    parents.push('127.0.0.1')
  }

  return parents
}

export const TwitchEmbed = ({
  channel,
  width = TWITCH_CONFIG.DEFAULT_WIDTH,
  height = TWITCH_CONFIG.DEFAULT_HEIGHT,
}: TwitchEmbedProps) => {
  // State
  const [isStreamOnline, setIsStreamOnline] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [isScriptLoaded, setIsScriptLoaded] = useState<boolean>(false)

  // Refs
  const playerRef = useRef<TwitchPlayer | null>(null)

  // ID Generation (Sanitized for DOM usage)
  const uniqueId = useId()
  const embedId = `twitch-embed-${uniqueId.replace(/[^a-zA-Z0-9-_]/g, '')}`

  // Check for pre-loaded script (e.g., client-side navigation)
  useEffect(() => {
    if (window.Twitch?.Embed) {
      setIsScriptLoaded(true)
    }
  }, [])

  // Initialize Player
  useEffect(() => {
    if (!isScriptLoaded) return

    const container = document.getElementById(embedId)
    // Safety check: Clear container to prevent duplicate iframes in React Strict Mode
    if (container) {
      container.innerHTML = ''
    }

    try {
      const embed = new window.Twitch.Embed(embedId, {
        width,
        height,
        channel,
        parent: getParentDomains(),
        layout: 'video',
        autoplay: true,
        muted: true, // Auto-play policies usually require muting first
        allowfullscreen: true,
      })

      playerRef.current = embed

      // Event Handlers
      const handleOnline = () => {
        setIsStreamOnline(true)
        setIsLoading(false)
      }

      const handleOffline = () => {
        setIsStreamOnline(false)
        setIsLoading(false)
      }

      const handleReady = () => {
        // Ensure player starts when ready
        if (playerRef.current) {
          playerRef.current.setMuted(true)
          playerRef.current.play()
        }
      }

      // Bind Events
      embed.addEventListener(TWITCH_CONFIG.EVENTS.ONLINE, handleOnline)
      embed.addEventListener(TWITCH_CONFIG.EVENTS.OFFLINE, handleOffline)
      embed.addEventListener(TWITCH_CONFIG.EVENTS.READY, handleReady)

      // Cleanup
      return () => {
        if (playerRef.current) {
            // Note: Twitch API doesn't always cleanly remove listeners, but good practice
            try {
                // @ts-ignore - Some Twitch types are loose on removeEventListener
                playerRef.current.removeEventListener(TWITCH_CONFIG.EVENTS.ONLINE, handleOnline)
                // @ts-ignore
                playerRef.current.removeEventListener(TWITCH_CONFIG.EVENTS.OFFLINE, handleOffline)
                // @ts-ignore
                playerRef.current.removeEventListener(TWITCH_CONFIG.EVENTS.READY, handleReady)
            } catch (e) {
                // Ignore cleanup errors on unmount
            }
        }
      }
    } catch (error) {
      console.error('Failed to initialize Twitch Embed:', error)
      setIsLoading(false)
    }
  }, [isScriptLoaded, channel, width, height, embedId])

  return (
    <div
      className="relative w-full overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950 shadow-xl"
      style={{ height }}
    >
      <Script
        src={TWITCH_CONFIG.SCRIPT_URL}
        onLoad={() => setIsScriptLoaded(true)}
        strategy="afterInteractive"
      />

      <div
        id={embedId}
        className="absolute inset-0 z-0 h-full w-full"
      />

      {/* Loading Overlay */}
      {isLoading && (
        <div className="pointer-events-none absolute inset-0 z-20 flex flex-col items-center justify-center bg-zinc-950 text-white">
          <Loader2 className="mb-4 size-10 animate-spin text-blue-500" />
          <p className="text-zinc-400">Chargement du stream...</p>
        </div>
      )}

      {/* Offline Overlay */}
      {!isLoading && !isStreamOnline && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-zinc-950 p-12 text-center">
          <div className="mb-4 rounded-full bg-zinc-900 p-6 ring-1 ring-zinc-800">
            <ScreenShareOff className="size-12 text-zinc-500" />
          </div>
          <h3 className="mb-2 text-xl font-semibold text-white">
            Le stream est actuellement offline
          </h3>
          <p className="max-w-md text-zinc-400">
            {channel} ne stream pas actuellement. Revenez plus tard ou suivez sa
            chaîne sur Twitch.
          </p>
        </div>
      )}
    </div>
  )
}
