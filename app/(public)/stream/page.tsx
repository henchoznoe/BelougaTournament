/**
 * File: app/(public)/stream/page.tsx
 * Description: Stream page.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { TwitchPlayer } from '@/components/features/stream/twitch-player'
import { getGlobalSettings } from '@/lib/services/settings'

const StreamPage = async () => {
  const globalSettings = await getGlobalSettings()

  return (
    <div className="container mx-auto px-4 py-24 flex flex-col items-center">
      <div className="mb-12 text-center">
        <h1 className="font-paladins text-4xl tracking-wider text-white sm:text-5xl uppercase drop-shadow-[0_0_15px_rgba(255,255,255,0.1)] mb-4">
          Live Stream
        </h1>
        <p className="text-zinc-400 max-w-2xl mx-auto">
          Retrouvez en direct toutes nos compétitions et événements spéciaux sur
          notre chaîne officielle.
        </p>
      </div>
      <div className="w-full max-w-5xl">
        <TwitchPlayer channel={globalSettings.twitchUsername ?? undefined} />
      </div>
    </div>
  )
}

export default StreamPage
