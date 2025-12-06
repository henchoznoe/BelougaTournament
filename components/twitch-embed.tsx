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

const TWITCH_SCRIPT_URL = "https://embed.twitch.tv/embed/v1.js";

interface TwitchEmbedProps {
  channel: string;
  width?: string | number;
  height?: string | number;
}

declare global {
  interface Window {
    Twitch: {
      Embed: new (
        id: string,
        options: {
          width: string | number;
          height: string | number;
          channel: string;
          parent: string[];
          layout?: string;
          autoplay?: boolean;
          muted?: boolean;
          allowfullscreen?: boolean;
        }
      ) => TwitchPlayer;
    };
  }
}

interface TwitchPlayer {
  addEventListener: (event: string, callback: () => void) => void;
  removeEventListener: (event: string, callback: () => void) => void;
  play: () => void;
  pause: () => void;
  setMuted: (muted: boolean) => void;
  getMuted: () => boolean;
  setVolume: (volume: number) => void;
}

export function TwitchEmbed({
  channel,
  width = "100%",
  height = 600,
}: TwitchEmbedProps) {
  const [isStreamOnline, setIsStreamOnline] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isScriptLoaded, setIsScriptLoaded] = useState<boolean>(false);
  const playerRef = useRef<TwitchPlayer | null>(null);

  // Use React.useId() for a stable, unique ID across server and client
  const uniqueId = useId();
  // Sanitize the ID to ensure it's a valid HTML ID without special characters like colons
  const embedId = `twitch-embed-${uniqueId.replace(/[^a-zA-Z0-9-_]/g, '')}`;

  useEffect(() => {
    // Check if script is already loaded (e.g. from a previous page or navigation)
    if (window.Twitch && window.Twitch.Embed) {
      setIsScriptLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!isScriptLoaded) return;

    // Clean up previous instance if any
    const container = document.getElementById(embedId);
    if (container) {
      container.innerHTML = "";
    }

    try {
      const parentDomain = window.location.hostname;
      const parents = [parentDomain];
      // Add localhost for development if we are on localhost
      if (parentDomain === "localhost") {
        parents.push("127.0.0.1");
      }

      const embed = new window.Twitch.Embed(embedId, {
        width,
        height,
        channel,
        parent: parents,
        layout: "video",
        autoplay: true,
        muted: true, // Start muted to allow autoplay
        allowfullscreen: true,
      });

      playerRef.current = embed;

      const handleOnline = () => {
        console.log("Stream is Online");
        setIsStreamOnline(true);
        setIsLoading(false);
      };

      const handleOffline = () => {
        console.log("Stream is Offline");
        setIsStreamOnline(false);
        setIsLoading(false);
      };

      const handleReady = () => {
        console.log("Twitch Player Ready");
        // Verify playback
        if (playerRef.current) {
            playerRef.current.setMuted(true);
            playerRef.current.play();
        }
      };

      embed.addEventListener("online", handleOnline);
      embed.addEventListener("offline", handleOffline);
      embed.addEventListener("VIDEO_READY", handleReady);

      return () => {
        if (playerRef.current) {
          playerRef.current.removeEventListener("online", handleOnline);
          playerRef.current.removeEventListener("offline", handleOffline);
          playerRef.current.removeEventListener("VIDEO_READY", handleReady);
        }
      };
    } catch (error) {
      console.error("Failed to initialize Twitch Embed:", error);
      setIsLoading(false); // Fallback to avoid infinite loading
    }
  }, [isScriptLoaded, channel, width, height, embedId]);

  return (
    <div
      className="relative w-full overflow-hidden rounded-lg bg-zinc-950 shadow-xl border border-zinc-800"
      style={{ height }}
    >
      <Script
        src={TWITCH_SCRIPT_URL}
        onLoad={() => setIsScriptLoaded(true)}
        strategy="afterInteractive"
      />

      <div
        id={embedId}
        className="absolute inset-0 z-0"
        style={{ width: "100%", height: "100%" }}
      />

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-zinc-950 text-white pointer-events-none">
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
            chaîne sur Twitch pour être informé de son prochain stream.
          </p>
        </div>
      )}
    </div>
  );
}
