"use client";

import dynamic from "next/dynamic";

const TwitchEmbed = dynamic(
  () => import("@/components/twitch-embed").then((mod) => mod.TwitchEmbed),
  {
    loading: () => (
      <div className="flex h-[600px] w-full items-center justify-center rounded-lg bg-zinc-900 text-zinc-500">
        Chargement du stream...
      </div>
    ),
    ssr: false,
  }
);

export function StreamWrapper({ channel }: { channel: string }) {
  return <TwitchEmbed channel={channel} />;
}
