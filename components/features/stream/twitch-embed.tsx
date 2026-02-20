/**
 * File: components/features/stream/twitch-embed.tsx
 * Description: A component to embed a Twitch stream with offline detection and a fallback UI.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

"use client"

import { Loader2, ScreenShareOff } from "lucide-react"
import Script from "next/script"
import { useEffect, useId, useRef, useState } from "react"

interface TwitchEmbedProps {
  channel: string | null | undefined
  width?: string | number
  height?: string | number
}

declare global {
  interface Window {
    Twitch: {
      Embed: new (
        id: string,
        options: TwitchEmbedOptions,
      ) => TwitchPlayer
    }
  }
}

interface TwitchEmbedOptions {
  width: string | number
  height: string | number
  channel: string
  parent: string[]
  layout?: "video" | "video-with-chat"
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

const TWITCH_CONFIG = {
  SCRIPT_URL: "https://embed.twitch.tv/embed/v1.js",
  DEFAULT_WIDTH: "100%",
  DEFAULT_HEIGHT: 600,
  EVENTS: {
    ONLINE: "online",
    OFFLINE: "offline",
    READY: "VIDEO_READY",
  },
} as const

const getParentDomains = (): string[] => {
  if (typeof window === "undefined") return []

  const hostname = window.location.hostname
  const parents = [hostname]

  if (hostname === "localhost") {
    parents.push("127.0.0.1")
  }

  return parents
}

const extractTwitchChannel = (
  urlOrUsername: string | null | undefined,
): string | null => {
  if (!urlOrUsername) {
    return null
  }

  // Try to match standard Twitch URL patterns
  const match = urlOrUsername.match(/twitch\.tv\/([a-zA-Z0-9_]+)/)

  if (match?.[1]) {
    return match[1]
  }

  // If no URL pattern is found but string is not empty and has no slashes, assume it's the username
  if (!urlOrUsername.includes('/')) {
    return urlOrUsername
  }

  return null
}

export const TwitchEmbed = ({
  channel,
  width = TWITCH_CONFIG.DEFAULT_WIDTH,
  height = TWITCH_CONFIG.DEFAULT_HEIGHT,
}: TwitchEmbedProps) => {
  const [isStreamOnline, setIsStreamOnline] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [isScriptLoaded, setIsScriptLoaded] = useState<boolean>(false)

  const playerRef = useRef<TwitchPlayer | null>(null)

  const uniqueId = useId()
  const embedId = `twitch-embed-${uniqueId.replace(/[^a-zA-Z0-9-_]/g, "")}`

  const channelName = extractTwitchChannel(channel)

  useEffect(() => {
    if (window.Twitch?.Embed) {
      setIsScriptLoaded(true)
    }
  }, [])

  if (!channelName) {
     return (
        <div
            className="flex w-full flex-col items-center justify-center rounded-lg border border-zinc-800 bg-zinc-950 p-12 text-center text-zinc-400 shadow-xl"
            style={{ height }}
        >
            <ScreenShareOff className="mb-4 size-10 text-zinc-600" />
            <p>Le stream n'est pas configuré</p>
        </div>
    )
  }

  useEffect(() => {
    if (!isScriptLoaded) return

    const container = document.getElementById(embedId)
    if (container) {
      container.innerHTML = ""
    }

    try {
      const embed = new window.Twitch.Embed(embedId, {
        width,
        height,
        channel: channelName,
        parent: getParentDomains(),
        layout: "video",
        autoplay: true,
        muted: true,
        allowfullscreen: true,
      })

      playerRef.current = embed

      const handleOnline = () => {
        setIsStreamOnline(true)
        setIsLoading(false)
      }

      const handleOffline = () => {
        setIsStreamOnline(false)
        setIsLoading(false)
      }

      const handleReady = () => {
        if (playerRef.current) {
          playerRef.current.setMuted(true)
          playerRef.current.play()
        }
      }

      embed.addEventListener(TWITCH_CONFIG.EVENTS.ONLINE, handleOnline)
      embed.addEventListener(TWITCH_CONFIG.EVENTS.OFFLINE, handleOffline)
      embed.addEventListener(TWITCH_CONFIG.EVENTS.READY, handleReady)

      return () => {
        if (playerRef.current) {
          try {
            // @ts-ignore - Some Twitch types are loose on removeEventListener
            playerRef.current.removeEventListener(
              TWITCH_CONFIG.EVENTS.ONLINE,
              handleOnline,
            )
            // @ts-ignore
            playerRef.current.removeEventListener(
              TWITCH_CONFIG.EVENTS.OFFLINE,
              handleOffline,
            )
            // @ts-ignore
            playerRef.current.removeEventListener(
              TWITCH_CONFIG.EVENTS.READY,
              handleReady,
            )
          } catch (_e) {
            // Ignore cleanup errors on unmount
          }
        }
      }
    } catch (_error) {
      setIsLoading(false)
    }
  }, [isScriptLoaded, channelName, width, height, embedId])

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

      <div id={embedId} className="absolute inset-0 z-0 h-full w-full" />

      {isLoading && (
        <div className="pointer-events-none absolute inset-0 z-20 flex flex-col items-center justify-center bg-zinc-950 text-white">
          <Loader2 className="mb-4 size-10 animate-spin text-blue-500" />
          <p className="text-zinc-400">Chargement du stream...</p>
        </div>
      )}

      {!isLoading && !isStreamOnline && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-zinc-950 p-12 text-center">
          <div className="mb-4 rounded-full bg-zinc-900 p-6 ring-1 ring-zinc-800">
            <ScreenShareOff className="size-12 text-zinc-500" />
          </div>
          <h3 className="mb-2 text-xl font-semibold text-white">
            Le stream est hors ligne
          </h3>
          <p className="max-w-md text-zinc-400">
            {channel}
            Le stream n'est pas en direct
          </p>
        </div>
      )}
    </div>
  )
}
