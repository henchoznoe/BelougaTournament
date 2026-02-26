/**
 * File: app/(public)/stream/page.tsx
 * Description: Stream page.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { TwitchPlayer } from '@/components/features/stream/twitch-player'
import { PageHeader } from '@/components/ui/page-header'
import { getGlobalSettings } from '@/lib/services/settings'

const StreamPage = async () => {
  const globalSettings = await getGlobalSettings()

  return (
    <div className="container mx-auto px-4 py-32 flex flex-col items-center">
      <PageHeader
        title="Live Stream"
        description="Retrouvez en direct toutes nos compétitions et événements spéciaux sur notre chaîne officielle."
        className="mb-12"
      />
      <div className="w-full max-w-5xl min-w-0 overflow-hidden">
        <TwitchPlayer channel={globalSettings.twitchUsername ?? undefined} />
      </div>
    </div>
  )
}

export default StreamPage
