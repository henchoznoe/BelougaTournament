/**
 * File: components/twitch-embed.tsx
 * Description: A component to embed a Twitch stream with offline detection and a fallback UI.
 * Author: Noé Henchoz
 * Date: 2025-12-03
 * License: MIT
 */

"use client";

import Script from "next/script";
import { useEffect, useRef, useState } from "react";
import { ScreenShareOff } from "lucide-react";

const TWITCH_SCRIPT_URL = "https://embed.twitch.tv/embed/v1.js";
const TWITCH_PLAYER_ELEMENT_ID = "twitch-embed";

interface TwitchEmbedProps {
  channel: string;
  width?: string | number;
  height?: string | number;
  targetDomain?: string;
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
}

export function TwitchEmbed({channel, width = "100%", height = 600}: TwitchEmbedProps) {

  const [isStreamOnline, setIsStreamOnline] = useState<boolean>(false);
  const [isScriptLoaded, setIsScriptLoaded] = useState<boolean>(false);
  const playerRef = useRef<TwitchPlayer | null>(null);

  useEffect(() => {
    if (!isScriptLoaded) return;
    const container = document.getElementById(TWITCH_PLAYER_ELEMENT_ID);
    if (container) container.innerHTML = "";

    try {
      const embed = new window.Twitch.Embed(TWITCH_PLAYER_ELEMENT_ID, {
        width,
        height,
        channel,
        parent: ["localhost", process.env.NEXT_PUBLIC_TWITCH_PARENT || "localhost"],
        layout: "video",
        autoplay: true,
      });

      playerRef.current = embed;

      const handleOnline = () => setIsStreamOnline(true);
      const handleOffline = () => setIsStreamOnline(false);

      embed.addEventListener("ONLINE", handleOnline);
      embed.addEventListener("OFFLINE", handleOffline);

      return () => {
        embed.removeEventListener("ONLINE", handleOnline);
        embed.removeEventListener("OFFLINE", handleOffline);
      };
    } catch (error) {
      console.error("Failed to initialize Twitch Embed:", error);
    }
  }, [isScriptLoaded, channel, width, height]);

  return (
    <div className="relative w-full overflow-hidden rounded-lg bg-zinc-950 shadow-xl border border-zinc-800">
      <Script
        src={TWITCH_SCRIPT_URL}
        onLoad={() => setIsScriptLoaded(true)}
        strategy="afterInteractive"
      />

      <div
        id={TWITCH_PLAYER_ELEMENT_ID}
        className={isStreamOnline ? "block" : "hidden"}
        style={{ width: "100%", height: "100%" }}
      />

      {!isStreamOnline && (
        <div className="flex flex-col items-center justify-center p-12 text-center h-[600px] w-full">
          <div className="mb-4 rounded-full bg-zinc-900 p-6 ring-1 ring-zinc-800">
            <ScreenShareOff className="h-12 w-12 text-zinc-500" />
          </div>
          <h3 className="mb-2 text-xl font-semibold text-white">
            Le stream est actuellement offline
          </h3>
          <p className="text-zinc-400 max-w-md">
            {channel} ne stream pas actuellement. Revenez plus tard ou suivez sa chaîne sur Twitch pour être informé de son prochain stream.
          </p>
        </div>
      )}
    </div>
  );
}
